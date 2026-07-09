-- Setores de irrigacao (linhas fixas: 1 a 6)
create table setores (
  id smallint primary key,
  nome text not null,
  rele_index smallint not null,
  hora_inicio text not null,
  duracao_minutos int not null,
  dias_semana int[] not null default '{}',
  ativo boolean not null default true,
  status text not null default 'desligado'
    check (status in ('ativo', 'aguardando', 'desligado', 'erro')),
  progresso_minutos int
);

create table leituras_sensor (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  umidade numeric not null,
  temperatura numeric not null,
  ec numeric not null,
  ph numeric not null,
  nitrogenio numeric not null,
  fosforo numeric not null,
  potassio numeric not null
);

create table estado_sistema (
  id smallint primary key default 1,
  online boolean not null default false,
  ultima_sincronizacao timestamptz,
  bomba_ligada boolean not null default false,
  modo_operacao text not null default 'sequencial'
    check (modo_operacao in ('sequencial', 'paralelo')),
  max_setores_simultaneos smallint not null default 1,
  constraint unica_linha check (id = 1)
);

insert into setores (id, nome, rele_index, hora_inicio, duracao_minutos, dias_semana, ativo, status) values
  (1, 'Setor 1', 1, '06:00', 20, '{1,3,5}', true, 'aguardando'),
  (2, 'Setor 2', 2, '06:25', 20, '{1,3,5}', true, 'aguardando'),
  (3, 'Setor 3', 3, '06:50', 25, '{1,3,5}', true, 'aguardando'),
  (4, 'Setor 4', 4, '07:20', 20, '{2,4,6}', true, 'aguardando'),
  (5, 'Setor 5', 5, '07:45', 20, '{2,4,6}', false, 'desligado'),
  (6, 'Setor 6', 6, '08:10', 20, '{2,4,6}', true, 'aguardando');

insert into estado_sistema (id, online, bomba_ligada, modo_operacao) values
  (1, false, false, 'sequencial');

alter table setores enable row level security;
alter table leituras_sensor enable row level security;
alter table estado_sistema enable row level security;

create policy "acesso total temporario" on setores for all using (true) with check (true);
create policy "acesso total temporario" on leituras_sensor for all using (true) with check (true);
create policy "acesso total temporario" on estado_sistema for all using (true) with check (true);
