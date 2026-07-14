-- Reorganiza a tabela setores: corrige janelas invertidas (fim < inicio),
-- normaliza dias da semana, e limpa o status para "desligado" (nada rodando agora).
-- Rode isto no SQL Editor do Supabase.

update setores set
  janelas = jsonb_build_array(jsonb_build_object('inicio', '06:00', 'fim', '06:20')),
  dias_semana = '{1,3,5}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 1;

update setores set
  janelas = jsonb_build_array(jsonb_build_object('inicio', '06:25', 'fim', '06:45')),
  dias_semana = '{1,3,5}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 2;

update setores set
  janelas = jsonb_build_array(jsonb_build_object('inicio', '06:50', 'fim', '07:15')),
  dias_semana = '{1,3,5}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 3;

update setores set
  janelas = jsonb_build_array(jsonb_build_object('inicio', '07:20', 'fim', '07:40')),
  dias_semana = '{2,4,6}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 4;

update setores set
  janelas = jsonb_build_array(jsonb_build_object('inicio', '07:45', 'fim', '08:05')),
  dias_semana = '{2,4,6}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 5;

update setores set
  janelas = jsonb_build_array(
    jsonb_build_object('inicio', '08:10', 'fim', '08:30'),
    jsonb_build_object('inicio', '18:00', 'fim', '18:30')
  ),
  dias_semana = '{2,4,6}',
  ativo = true,
  status = 'desligado',
  progresso_minutos = null
where id = 6;

-- Confere o resultado
select id, nome, rele_index, janelas, dias_semana, ativo, status, progresso_minutos
from setores
order by id;
