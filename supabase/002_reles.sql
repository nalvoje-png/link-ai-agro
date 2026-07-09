-- Tabela de teste/controle direto dos 8 reles fisicos da HKL-EA8
-- id 0 = rele 01 fisico (bomba), id 1-6 = reles 02-07 (setores 1-6), id 7 = rele 08 (reserva)
create table reles (
  id smallint primary key,
  nome text not null,
  ligado boolean not null default false,
  atualizado_em timestamptz not null default now()
);

insert into reles (id, nome, ligado) values
  (0, 'Bomba', false),
  (1, 'Setor 1', false),
  (2, 'Setor 2', false),
  (3, 'Setor 3', false),
  (4, 'Setor 4', false),
  (5, 'Setor 5', false),
  (6, 'Setor 6', false),
  (7, 'Reserva', false);

alter table reles enable row level security;
create policy "acesso total temporario" on reles for all using (true) with check (true);
