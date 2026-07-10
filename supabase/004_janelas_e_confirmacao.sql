-- Converte hora_inicio/duracao_minutos (uma janela fixa) para uma lista de
-- janelas de horario (jsonb), permitindo varios horarios por setor.
alter table setores add column janelas jsonb not null default '[]'::jsonb;

update setores
set janelas = jsonb_build_array(
  jsonb_build_object(
    'inicio', hora_inicio,
    'fim', to_char(
      (hora_inicio::time + (duracao_minutos || ' minutes')::interval),
      'HH24:MI'
    )
  )
);

alter table setores drop column hora_inicio;
alter table setores drop column duracao_minutos;

-- Carimbo de quando o app enviou um comando manual para o rele — usado para
-- detectar falha de comunicacao (comparado com estado_sistema.ultima_sincronizacao).
alter table reles add column comando_em timestamptz;
