-- Historico de acionamentos por setor (liga/desliga, com origem)
create table eventos_setor (
  id bigint generated always as identity primary key,
  setor_id smallint not null references setores(id),
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('ligou', 'desligou')),
  origem text not null default 'automatico' check (origem in ('manual', 'automatico'))
);

create index idx_eventos_setor_setor_id on eventos_setor (setor_id, criado_em desc);

alter table eventos_setor enable row level security;
create policy "acesso total temporario" on eventos_setor for all using (true) with check (true);

-- Cada setor pode ter (ou nao) um sensor associado. Comeca sem sensor.
alter table setores add column tem_sensor boolean not null default false;

-- Liga uma leitura de sensor a um setor especifico (null = leitura geral, sem setor)
alter table leituras_sensor add column setor_id smallint references setores(id);
