/*
  Link-AI Agro — Controlador principal
  Placa: HKL-EA8 (ESP32 + PCF8574 nos reles 0x24 + RS485 para o sensor NPK)

  O que este firmware faz, a cada ciclo:
  1. Sincroniza o relogio via NTP (fuso horario de Brasilia, UTC-3)
  2. Busca os setores e o estado do sistema no Supabase
  3. Decide quais setores deveriam estar irrigando agora (respeitando dias da
     semana, horario, duracao, e o modo sequencial/paralelo)
  4. Aciona os reles fisicos (bomba + setores) via I2C
  5. Escreve de volta no Supabase o status atualizado de cada setor
  6. A cada N minutos, le o sensor de solo via Modbus RS485 e grava uma nova
     leitura na tabela leituras_sensor

  Preencha as constantes de configuracao antes de gravar.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <time.h>
#include <ModbusMaster.h>

// ---------- Configuracao ----------
const char* WIFI_SSID = "SEU_WIFI_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";

const char* SUPABASE_URL = "https://xxxxx.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJ...";

const long GMT_OFFSET_SEC = -3 * 3600; // Brasilia (UTC-3, sem horario de verao atualmente)
const int DAYLIGHT_OFFSET_SEC = 0;
const char* NTP_SERVER = "pool.ntp.org";

const unsigned long INTERVALO_AGENDADOR_MS = 20000;   // avalia o agendamento a cada 20s
const unsigned long INTERVALO_SENSOR_MS = 10UL * 60UL * 1000UL; // le o sensor a cada 10 min

// ---------- I2C / Reles ----------
#define SDA_PIN 4
#define SCL_PIN 5
#define PCF_RELAY_ADDR 0x24
uint8_t relayState = 0xFF; // ativo em LOW

void writeRelays(uint8_t state) {
  Wire.beginTransmission(PCF_RELAY_ADDR);
  Wire.write(state);
  Wire.endTransmission();
}

// ---------- RS485 / Sensor NPK ----------
#define RX_PIN 16
#define TX_PIN 17
#define SENSOR_SLAVE_ID 1
ModbusMaster sensorNode;

// ---------- Modelo local de um setor ----------
struct SetorFW {
  int id;
  int releIndex;
  int horaInicioMin; // minutos desde 00:00
  int duracaoMinutos;
  uint8_t diasSemanaMask; // bit 0 = domingo ... bit 6 = sabado
  bool ativo;
};

SetorFW setores[8];
int totalSetores = 0;
String modoOperacao = "sequencial";
int maxSetoresSimultaneos = 1;

// ---------- Utilitarios HTTP ----------
String urlBase() {
  return String(SUPABASE_URL) + "/rest/v1/";
}

void adicionarHeadersPadrao(HTTPClient& http) {
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Content-Type", "application/json");
}

int minutosDoHorario(const char* hhmm) {
  int h = (hhmm[0] - '0') * 10 + (hhmm[1] - '0');
  int m = (hhmm[3] - '0') * 10 + (hhmm[4] - '0');
  return h * 60 + m;
}

// ---------- Busca setores + estado no Supabase ----------
bool buscarSetoresEEstado() {
  HTTPClient http;
  String url = urlBase() + "setores?select=*&order=id";
  http.begin(url);
  adicionarHeadersPadrao(http);
  int codigo = http.GET();
  if (codigo != 200) {
    Serial.print("Erro ao buscar setores: ");
    Serial.println(codigo);
    http.end();
    return false;
  }
  String corpo = http.getString();
  http.end();

  JsonDocument doc;
  if (deserializeJson(doc, corpo)) {
    Serial.println("Erro ao interpretar JSON de setores.");
    return false;
  }

  totalSetores = 0;
  for (JsonObject item : doc.as<JsonArray>()) {
    if (totalSetores >= 8) break;
    SetorFW& s = setores[totalSetores];
    s.id = item["id"];
    s.releIndex = item["rele_index"];
    s.horaInicioMin = minutosDoHorario(item["hora_inicio"].as<const char*>());
    s.duracaoMinutos = item["duracao_minutos"];
    s.ativo = item["ativo"];

    s.diasSemanaMask = 0;
    for (JsonVariant dia : item["dias_semana"].as<JsonArray>()) {
      int d = dia.as<int>();
      if (d >= 0 && d <= 6) s.diasSemanaMask |= (1 << d);
    }
    totalSetores++;
  }

  // Estado do sistema (modo de operacao)
  HTTPClient http2;
  String url2 = urlBase() + "estado_sistema?select=modo_operacao,max_setores_simultaneos&id=eq.1";
  http2.begin(url2);
  adicionarHeadersPadrao(http2);
  int codigo2 = http2.GET();
  if (codigo2 == 200) {
    String corpo2 = http2.getString();
    JsonDocument doc2;
    if (!deserializeJson(doc2, corpo2)) {
      JsonArray arr = doc2.as<JsonArray>();
      if (arr.size() > 0) {
        modoOperacao = arr[0]["modo_operacao"].as<String>();
        maxSetoresSimultaneos = arr[0]["max_setores_simultaneos"];
      }
    }
  }
  http2.end();

  return true;
}

// ---------- Escreve o status de um setor no Supabase ----------
void gravarStatusSetor(int id, const char* status, int progressoMinutos) {
  HTTPClient http;
  String url = urlBase() + "setores?id=eq." + String(id);
  http.begin(url);
  adicionarHeadersPadrao(http);
  http.addHeader("Prefer", "return=minimal");

  JsonDocument doc;
  doc["status"] = status;
  if (progressoMinutos >= 0) doc["progresso_minutos"] = progressoMinutos;
  else doc["progresso_minutos"] = nullptr;

  String corpo;
  serializeJson(doc, corpo);
  http.PATCH(corpo);
  http.end();
}

// ---------- Atualiza estado_sistema (bomba, ultima sincronizacao) ----------
void gravarEstadoSistema(bool bombaLigada) {
  HTTPClient http;
  String url = urlBase() + "estado_sistema?id=eq.1";
  http.begin(url);
  adicionarHeadersPadrao(http);
  http.addHeader("Prefer", "return=minimal");

  JsonDocument doc;
  doc["online"] = true;
  doc["bomba_ligada"] = bombaLigada;

  String corpo;
  serializeJson(doc, corpo);
  http.PATCH(corpo);
  http.end();
}

// ---------- Busca comandos manuais (tabela reles, usada pelo botao Ligar/Desligar agora) ----------
bool buscarRelesManuais(bool manualLigado[8]) {
  for (int i = 0; i < 8; i++) manualLigado[i] = false;

  HTTPClient http;
  String url = urlBase() + "reles?select=id,ligado&order=id";
  http.begin(url);
  adicionarHeadersPadrao(http);
  int codigo = http.GET();
  if (codigo != 200) {
    Serial.print("Erro ao buscar reles manuais: ");
    Serial.println(codigo);
    http.end();
    return false;
  }
  String corpo = http.getString();
  http.end();

  JsonDocument doc;
  if (deserializeJson(doc, corpo)) {
    Serial.println("Erro ao interpretar JSON de reles.");
    return false;
  }
  for (JsonObject item : doc.as<JsonArray>()) {
    int id = item["id"];
    bool ligado = item["ligado"];
    if (id >= 0 && id < 8) manualLigado[id] = ligado;
  }
  return true;
}

// ---------- Motor de agendamento ----------
void avaliarAgendamento() {
  struct tm agora;
  if (!getLocalTime(&agora)) {
    Serial.println("Falha ao obter hora local (NTP).");
    return;
  }
  int minutoAtual = agora.tm_hour * 60 + agora.tm_min;
  int diaSemanaAtual = agora.tm_wday; // 0 = domingo

  bool manualLigado[8];
  buscarRelesManuais(manualLigado);

  // 1) Descobre quais setores estao dentro da janela de horario hoje
  bool candidato[8] = { false };
  for (int i = 0; i < totalSetores; i++) {
    SetorFW& s = setores[i];
    bool diaOk = s.diasSemanaMask & (1 << diaSemanaAtual);
    bool horarioOk = s.ativo && diaOk &&
      minutoAtual >= s.horaInicioMin &&
      minutoAtual < (s.horaInicioMin + s.duracaoMinutos);
    candidato[i] = horarioOk;
  }

  // 2) Aplica a regra do modo de operacao
  bool deveIrrigar[8] = { false };
  if (modoOperacao == "paralelo") {
    int ligados = 0;
    for (int i = 0; i < totalSetores && ligados < maxSetoresSimultaneos; i++) {
      if (candidato[i]) {
        deveIrrigar[i] = true;
        ligados++;
      }
    }
  } else {
    // sequencial: so o primeiro candidato (por ordem de id/hora) fica ativo
    for (int i = 0; i < totalSetores; i++) {
      if (candidato[i]) {
        deveIrrigar[i] = true;
        break;
      }
    }
  }

  // 3) Mescla com comandos manuais: um clique em "Ligar agora" no app vale
  //    mesmo fora do horario agendado (comando manual OU agendamento).
  for (int i = 0; i < totalSetores; i++) {
    SetorFW& s = setores[i];
    if (s.releIndex >= 0 && s.releIndex < 8 && manualLigado[s.releIndex]) {
      deveIrrigar[i] = true;
    }
  }

  // 4) Aciona os reles fisicos e grava o status de volta
  bool algumAtivo = false;
  uint8_t novoEstadoFisico = 0xFF; // todos desligados por padrao (ativo em LOW)

  for (int i = 0; i < totalSetores; i++) {
    SetorFW& s = setores[i];
    if (deveIrrigar[i]) {
      novoEstadoFisico &= ~(1 << s.releIndex); // liga (LOW)
      algumAtivo = true;
      int progresso = minutoAtual - s.horaInicioMin;
      gravarStatusSetor(s.id, "ativo", progresso >= 0 ? progresso : 0);
    } else {
      String statusFinal = s.ativo ? "aguardando" : "desligado";
      gravarStatusSetor(s.id, statusFinal.c_str(), -1);
    }
  }

  // Rele 0 = bomba: liga se qualquer setor estiver ativo, ou se a bomba foi
  // acionada manualmente pelo botao de teste direto.
  if (algumAtivo || manualLigado[0]) novoEstadoFisico &= ~(1 << 0);
  writeRelays(novoEstadoFisico);
  relayState = novoEstadoFisico;

  gravarEstadoSistema(algumAtivo || manualLigado[0]);

  Serial.print("Agendador avaliado. Bomba: ");
  Serial.println((algumAtivo || manualLigado[0]) ? "LIGADA" : "desligada");
}

// ---------- Leitura do sensor NPK e gravacao no Supabase ----------
void lerSensorEGravar() {
  uint8_t resultado = sensorNode.readHoldingRegisters(0x0000, 7);
  if (resultado != sensorNode.ku8MBSuccess) {
    Serial.print("Erro Modbus ao ler sensor: 0x");
    Serial.println(resultado, HEX);
    return;
  }

  float umidade = sensorNode.getResponseBuffer(0) / 10.0;
  float temperatura = sensorNode.getResponseBuffer(1) / 10.0;
  float ec = sensorNode.getResponseBuffer(2);
  float ph = sensorNode.getResponseBuffer(3) / 10.0;
  float n = sensorNode.getResponseBuffer(4);
  float p = sensorNode.getResponseBuffer(5);
  float k = sensorNode.getResponseBuffer(6);

  HTTPClient http;
  String url = urlBase() + "leituras_sensor";
  http.begin(url);
  adicionarHeadersPadrao(http);
  http.addHeader("Prefer", "return=minimal");

  JsonDocument doc;
  doc["umidade"] = umidade;
  doc["temperatura"] = temperatura;
  doc["ec"] = ec;
  doc["ph"] = ph;
  doc["nitrogenio"] = n;
  doc["fosforo"] = p;
  doc["potassio"] = k;

  String corpo;
  serializeJson(doc, corpo);
  int codigo = http.POST(corpo);
  http.end();

  Serial.print("Leitura do sensor gravada. HTTP ");
  Serial.println(codigo);
}

void conectarWiFi() {
  Serial.print("Conectando ao WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);
  writeRelays(relayState);

  Serial2.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  sensorNode.begin(SENSOR_SLAVE_ID, Serial2);

  conectarWiFi();
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

  Serial.println("Aguardando sincronizacao NTP...");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nHora sincronizada.");
}

void loop() {
  static unsigned long ultimoAgendamento = 0;
  static unsigned long ultimaLeituraSensor = 0;

  if (millis() - ultimoAgendamento >= INTERVALO_AGENDADOR_MS) {
    ultimoAgendamento = millis();
    if (buscarSetoresEEstado()) {
      avaliarAgendamento();
    }
  }

  if (millis() - ultimaLeituraSensor >= INTERVALO_SENSOR_MS) {
    ultimaLeituraSensor = millis();
    lerSensorEGravar();
  }
}
