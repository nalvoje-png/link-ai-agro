# Link-AI Agro

Dashboard de controle de irrigação para a Fazenda Conilon — 6 setores, controle de bomba, e leitura do sensor de solo (NPK/pH/EC/temperatura/umidade), com dados vindos da placa HKL-EA8 via Supabase.

Stack: React + Vite + TypeScript + Tailwind CSS + Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Configurando o Supabase

1. Copie `.env.example` para `.env`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados do seu projeto Supabase (Configurações → API).
3. Sem essas variáveis, o app roda normalmente com **dados de demonstração** (mock), só pra visualizar a tela.

## Estado atual

Este é o esqueleto visual do dashboard, ainda com dados mockados (`src/App.tsx`). Ainda faltam:

- [ ] Tabelas no Supabase (`setores`, `leituras_sensor`, `estado_sistema`)
- [ ] Conectar `PainelBomba`, `SetorCard` e `PerfilSolo` às tabelas reais (hoje usam dados fixos em `App.tsx`)
- [ ] Autenticação (login)
- [ ] Firmware da HKL-EA8 escrevendo no Supabase (a parte de hardware já foi validada à parte: relés via PCF8574 e leitura do sensor via Modbus RS485)

## Estrutura

```
src/
  components/
    PainelBomba.tsx   — status da bomba, setor ativo, modo de operação
    SetorCard.tsx      — card de cada setor: horário, duração, dias, liga/desliga manual
    PerfilSolo.tsx     — leitura do sensor de solo (visual de corte transversal)
  lib/
    supabaseClient.ts  — cliente Supabase (usa variáveis de ambiente)
  types.ts             — modelo de dados (Setor, LeituraSensor, EstadoSistema)
  App.tsx              — monta o dashboard
```

## Publicando na Vercel

1. Suba este projeto pro GitHub.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) nas configurações do projeto na Vercel.
