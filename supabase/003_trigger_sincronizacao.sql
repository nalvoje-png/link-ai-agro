-- Preenche automaticamente ultima_sincronizacao sempre que a HKL-EA8
-- atualizar estado_sistema (evita a placa ter que formatar timestamp).
create or replace function marcar_sincronizacao()
returns trigger as $$
begin
  new.ultima_sincronizacao := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_estado_sistema_sincronizacao
before update on estado_sistema
for each row
execute function marcar_sincronizacao();
