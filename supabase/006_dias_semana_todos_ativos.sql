-- Deixa todos os dias da semana ativos por padrao em todos os setores
-- (0=domingo ... 6=sabado)
update setores set dias_semana = '{0,1,2,3,4,5,6}';

select id, nome, dias_semana from setores order by id;
