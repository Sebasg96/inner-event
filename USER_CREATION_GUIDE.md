# Guía de Gestión de Usuarios Corporativos (Admin-Only)

Como tu aplicación es corporativa y **NO permites registro público**, el flujo correcto es que TÚ (como Administrador/Developer) crees las cuentas.

## Configuración Recomendada (Supabase)
1.  Ve a **Authentication -> Settings**.
2.  Desactiva **"Allow new users to sign up"**.
    *   Esto asegura que nadie pueda usar la ruta `/signup` o la API pública para registrarse. Solo tú podrás crear usuarios.

## Tu Flujo de Trabajo
Para registrar un nuevo empleado:
1.  Entras al **Dashboard de Supabase -> Authentication -> Users**.
2.  Usas el botón **"Invite User"** (envía email) o **"Create User"** (creas password tú).

## El Desafío Técnico (Y la Solución)
Cuando usas el botón "Create User" en el Dashboard, Supabase crea la credencial de acceso pero **NO crea el perfil en tu Base de Datos** (tabla `User`). Esto causa el error de login.

### Solución Obligatoria: Trigger de Base de Datos
Para que esto funcione automático, **DEBES** instalar este Trigger en tu Editor SQL de Supabase.

Esto hará que cada vez que crees un usuario en el Dashboard, PostgreSQL cree automáticamente su perfil en la aplicación.

```sql
-- 1. Función de Sincronización Automática
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_tenant_id text; 
begin
  -- Busca el Tenant (Organización) por defecto. 
  -- Si tienes varios tenants, podrías dejar esto fijo o mejorarlo después.
  select id into default_tenant_id from public."Tenant" limit 1;

  -- Si no hay tenant, usamos null o lanzamos error (opcional)
  if default_tenant_id is null then
      -- Opcional: Crear tenant default si no existe
      insert into public."Tenant" (id, name, domain) 
      values (gen_random_uuid(), 'Default Corp', 'default.com')
      returning id into default_tenant_id;
  end if;

  -- Crear el perfil en la tabla User
  insert into public."User" (id, email, name, "tenantId", role, password)
  values (
    new.id, -- Vincula con el ID de Auth
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    default_tenant_id,
    'USER', -- Rol por defecto
    'password_managed_by_supabase'
  );
  return new;
end;
$$;

-- 2. Activar el Trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Resultado
Con este script instalado una sola vez:
1.  Creas usuario en Supabase Dashboard.
2.  ¡Listo! El usuario ya tiene perfil y puede iniciar sesión inmediatamente.
