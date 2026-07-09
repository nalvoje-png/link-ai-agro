/*
  Link-AI Agro — Teste de reles via Supabase
  Placa: HKL-EA8 (ESP32 + PCF8574 nos reles, endereco I2C 0x24)

  O que este firmware faz:
  1. Conecta no WiFi
  2. A cada 3 segundos, consulta a tabela "reles" no Supabase (GET via HTTPS)
  3. Compara o estado recebido com o ultimo estado aplicado
  4. Se mudou, escreve o novo estado nos reles fisicos via I2C

  Preencha as constantes abaixo antes de gravar.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

// ---------- Configuracao ----------
const char* WIFI_SSID = "SEU_WIFI_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";

const char* SUPABASE_URL = "https://xxxxx.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJ...";

const unsigned long INTERVALO_POLL_MS = 3000;

// ---------- I2C / Reles ----------
#define SDA_PIN 4
#define SCL_PIN 5
#define PCF_RELAY_ADDR 0x24

uint8_t relayState = 0xFF; // todos desligados no boot (ativo em LOW)
uint8_t ultimoEstadoConhecido = 0xFF; // bit=1 => desligado, bit=0 => ligado (para comparar com o que veio do Supabase)

void writeRelays(uint8_t state) {
  Wire.beginTransmission(PCF_RELAY_ADDR);
  Wire.write(state);
  Wire.endTransmission();
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

// Consulta a tabela "reles" e retorna um bitmask (bit 0 = rele id 0, etc)
// bit = 1 significa "ligado" no Supabase
bool consultarReles(uint8_t &bitmaskLigado) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/reles?select=id,ligado&order=id";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  int codigo = http.GET();
  if (codigo != 200) {
    Serial.print("Erro HTTP ao consultar reles: ");
    Serial.println(codigo);
    http.end();
    return false;
  }

  String corpo = http.getString();
  http.end();

  JsonDocument doc; // ArduinoJson 7+
  DeserializationError erro = deserializeJson(doc, corpo);
  if (erro) {
    Serial.print("Erro ao interpretar JSON: ");
    Serial.println(erro.c_str());
    return false;
  }

  bitmaskLigado = 0;
  for (JsonObject item : doc.as<JsonArray>()) {
    int id = item["id"];
    bool ligado = item["ligado"];
    if (id >= 0 && id < 8 && ligado) {
      bitmaskLigado |= (1 << id);
    }
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);
  writeRelays(relayState); // tudo desligado no boot

  conectarWiFi();
  Serial.println("Iniciando polling de reles...");
}

void loop() {
  static unsigned long ultimaConsulta = 0;

  if (millis() - ultimaConsulta >= INTERVALO_POLL_MS) {
    ultimaConsulta = millis();

    uint8_t bitmaskLigado = 0;
    if (consultarReles(bitmaskLigado)) {
      if (bitmaskLigado != ultimoEstadoConhecido) {
        Serial.print("Novo estado recebido: 0b");
        Serial.println(bitmaskLigado, BIN);

        // Converte: bit=1 (ligado no Supabase) -> pino em LOW (rele ativo)
        uint8_t novoEstadoFisico = ~bitmaskLigado;
        writeRelays(novoEstadoFisico);

        ultimoEstadoConhecido = bitmaskLigado;
      }
    }
  }
}
