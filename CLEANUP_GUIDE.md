# 🧹 Limpieza del Proyecto - Archivos de Testing y Diagnóstico

## 📋 Archivos a Eliminar

### Scripts de Testing (*.js en raíz)
Estos archivos fueron creados para diagnóstico y testing durante el desarrollo:

```
✅ ELIMINAR - Scripts de Testing:
- apply_schema.js
- check_env_keys.js
- check_integration.js
- check_quota.js
- check_tables.js
- debug_env.js
- error_trigger.js
- fix_env.js
- full_rag_test.js
- inspect_db.js
- restore_db_url.js
- test_db.js
- test_gemini_fallback.js
- test_gemini_flash.js
- test_gen.js
- test_load.js
- test_login.js
- test_models.js
- test_rag.js
- test_tables.js
- verify_login.js
```

### Archivos de Log (*.txt en raíz)
```
✅ ELIMINAR - Logs:
- gen_error.txt
- gen_output.txt
- gen_test_log.txt
- generate_log.txt
- prisma_log.txt
- setup_error.txt
```

### Archivos de Backup (*.bak)
```
✅ ELIMINAR - Backups:
- .env.bak
- prisma.config.ts.bak
```

### Archivos Temporales de Prisma
```
✅ ELIMINAR - Temporales:
- minimal.prisma (archivo de prueba)
- migration.sql (ya aplicado)
```

### Documentación de Diagnóstico
```
⚠️ OPCIONAL - Documentación (puedes conservar si quieres):
- GEMINI_QUOTA_ISSUE.md
- LOGIN_DIAGNOSTICO.md
- PRAGMA_IA_AUTH.md
- RESUMEN_TRABAJO.md
```

## 📁 Archivos a CONSERVAR

### Archivos Esenciales del Proyecto
```
✅ CONSERVAR:
- .env
- .gitignore
- README.md
- eslint.config.mjs
- next-env.d.ts
- next.config.ts
- package.json
- package-lock.json
- tsconfig.json
- setup_vector.js (útil para configurar pgvector en nuevas instancias)
```

### Directorios Esenciales
```
✅ CONSERVAR:
- .git/
- .next/
- node_modules/
- prisma/
- public/
- src/
```

## 🚀 Comandos de Limpieza

### Opción 1: Mover a carpeta de archivo (Recomendado)
```powershell
# Crear carpeta de archivo
New-Item -ItemType Directory -Force -Path ".archive"

# Mover scripts de testing
Move-Item -Path "*.js" -Destination ".archive/" -Exclude "setup_vector.js"

# Mover logs
Move-Item -Path "*.txt" -Destination ".archive/"

# Mover backups
Move-Item -Path "*.bak" -Destination ".archive/"

# Mover archivos temporales
Move-Item -Path "minimal.prisma" -Destination ".archive/"
Move-Item -Path "migration.sql" -Destination ".archive/"
```

### Opción 2: Eliminar directamente (Más agresivo)
```powershell
# Eliminar scripts de testing
Remove-Item -Path "apply_schema.js", "check_*.js", "debug_env.js", "error_trigger.js", "fix_env.js", "full_rag_test.js", "inspect_db.js", "restore_db_url.js", "test_*.js", "verify_login.js"

# Eliminar logs
Remove-Item -Path "*.txt"

# Eliminar backups
Remove-Item -Path "*.bak"

# Eliminar temporales
Remove-Item -Path "minimal.prisma", "migration.sql"
```

### Opción 3: Mover documentación también
```powershell
# Si quieres archivar la documentación de diagnóstico
Move-Item -Path "GEMINI_QUOTA_ISSUE.md", "LOGIN_DIAGNOSTICO.md", "PRAGMA_IA_AUTH.md", "RESUMEN_TRABAJO.md" -Destination ".archive/"
```

## 📝 Actualizar .gitignore

Agrega estas líneas a tu `.gitignore` para evitar que archivos de testing se suban al repo:

```gitignore
# Testing and diagnostic files
test_*.js
check_*.js
debug_*.js
verify_*.js
*.txt
*.bak
.archive/
```

## ✅ Estructura Final Recomendada

Después de la limpieza, tu raíz del proyecto debería verse así:

```
inner-event/
├── .env
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── setup_vector.js (útil para deployment)
├── .git/
├── .next/
├── node_modules/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── ... (otros seeds)
├── public/
└── src/
    ├── app/
    ├── components/
    └── lib/
```

## 🎯 Recomendación

**Mejor enfoque**: Usar la **Opción 1** (mover a `.archive/`)

**Ventajas**:
- ✅ Puedes recuperar archivos si los necesitas
- ✅ Limpia el proyecto sin perder trabajo
- ✅ Fácil de revertir
- ✅ `.archive/` puede agregarse a `.gitignore`

**Después de verificar que todo funciona** (en 1-2 semanas), puedes eliminar la carpeta `.archive/` completamente.

---

**Nota**: Antes de ejecutar cualquier comando de limpieza, asegúrate de que:
1. ✅ El servidor está funcionando correctamente
2. ✅ El login funciona
3. ✅ PragmaIA aparece solo después del login
4. ✅ Has hecho commit de los cambios importantes
