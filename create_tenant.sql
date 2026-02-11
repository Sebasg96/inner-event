-- Crea un nuevo tenant generando un ID aleatorio (UUID v4)
-- Modifica los valores según necesites

INSERT INTO "Tenant" (
    "id",
    "name",
    "domain",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),  -- Genera un ID único automáticamente
    'Mi Nueva Empresa', -- Nombre de la empresa
    'mi-empresa.com',   -- Dominio único (ej: google.com)
    NOW(),              -- Fecha de creación
    NOW()               -- Fecha de actualización
)
RETURNING *;           -- Retorna el registro creado (incluido el ID)
