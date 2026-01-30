# Script de Limpieza Automática del Proyecto
# Este script mueve archivos de testing y diagnóstico a una carpeta .archive

Write-Host "🧹 Iniciando limpieza del proyecto..." -ForegroundColor Cyan
Write-Host ""

# Crear carpeta .archive si no existe
if (-not (Test-Path ".archive")) {
    New-Item -ItemType Directory -Path ".archive" | Out-Null
    Write-Host "✅ Carpeta .archive creada" -ForegroundColor Green
}

# Contador de archivos movidos
$movedCount = 0

# Función para mover archivos de forma segura
function Move-SafeFile {
    param($FilePath, $Description)
    if (Test-Path $FilePath) {
        try {
            Move-Item -Path $FilePath -Destination ".archive/" -Force
            Write-Host "  ✓ Movido: $FilePath" -ForegroundColor Gray
            return 1
        } catch {
            Write-Host "  ✗ Error moviendo: $FilePath" -ForegroundColor Yellow
            return 0
        }
    }
    return 0
}

Write-Host "📦 Moviendo scripts de testing..." -ForegroundColor Cyan

# Scripts de testing
$testScripts = @(
    "apply_schema.js",
    "check_env_keys.js",
    "check_integration.js",
    "check_quota.js",
    "check_tables.js",
    "debug_env.js",
    "error_trigger.js",
    "fix_env.js",
    "full_rag_test.js",
    "inspect_db.js",
    "restore_db_url.js",
    "test_db.js",
    "test_gemini_fallback.js",
    "test_gemini_flash.js",
    "test_gen.js",
    "test_load.js",
    "test_login.js",
    "test_models.js",
    "test_rag.js",
    "test_tables.js",
    "verify_login.js"
)

foreach ($script in $testScripts) {
    $movedCount += Move-SafeFile $script "Script de testing"
}

Write-Host ""
Write-Host "📄 Moviendo archivos de log..." -ForegroundColor Cyan

# Archivos de log
$logFiles = @(
    "gen_error.txt",
    "gen_output.txt",
    "gen_test_log.txt",
    "generate_log.txt",
    "prisma_log.txt",
    "setup_error.txt"
)

foreach ($log in $logFiles) {
    $movedCount += Move-SafeFile $log "Archivo de log"
}

Write-Host ""
Write-Host "💾 Moviendo archivos de backup..." -ForegroundColor Cyan

# Archivos de backup
$backupFiles = @(
    ".env.bak",
    "prisma.config.ts.bak"
)

foreach ($backup in $backupFiles) {
    $movedCount += Move-SafeFile $backup "Archivo de backup"
}

Write-Host ""
Write-Host "🗑️ Moviendo archivos temporales..." -ForegroundColor Cyan

# Archivos temporales
$tempFiles = @(
    "minimal.prisma",
    "migration.sql"
)

foreach ($temp in $tempFiles) {
    $movedCount += Move-SafeFile $temp "Archivo temporal"
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host "📊 Total de archivos movidos: $movedCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Los archivos están en: .archive/" -ForegroundColor Yellow
Write-Host "💡 Puedes eliminar esta carpeta cuando estés seguro de que no los necesitas" -ForegroundColor Gray
Write-Host ""

# Preguntar si quiere mover también la documentación de diagnóstico
Write-Host "¿Deseas mover también la documentación de diagnóstico? (S/N)" -ForegroundColor Yellow
Write-Host "  - GEMINI_QUOTA_ISSUE.md" -ForegroundColor Gray
Write-Host "  - LOGIN_DIAGNOSTICO.md" -ForegroundColor Gray
Write-Host "  - PRAGMA_IA_AUTH.md" -ForegroundColor Gray
Write-Host "  - RESUMEN_TRABAJO.md" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Respuesta"

if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "📚 Moviendo documentación de diagnóstico..." -ForegroundColor Cyan
    
    $docFiles = @(
        "GEMINI_QUOTA_ISSUE.md",
        "LOGIN_DIAGNOSTICO.md",
        "PRAGMA_IA_AUTH.md",
        "RESUMEN_TRABAJO.md"
    )
    
    $docMoved = 0
    foreach ($doc in $docFiles) {
        $docMoved += Move-SafeFile $doc "Documentación"
    }
    
    Write-Host ""
    Write-Host "✅ Documentación movida: $docMoved archivos" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 ¡Proyecto limpio y organizado!" -ForegroundColor Green
Write-Host ""
