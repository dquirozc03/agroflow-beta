@echo off
setlocal

echo ============================================
echo  AgroFlow Frontend - Arranque local
echo ============================================
echo.

cd /d "%~dp0"

REM ---- Verificar node_modules ----
if not exist "node_modules" (
    echo [ERROR] No existe la carpeta node_modules
    echo Ejecuta primero bootstrap.bat para instalar dependencias.
    goto end
)

REM ---- Verificar .env.local ----
if not exist ".env.local" (
    echo [ERROR] Falta frontend\.env.local con API_PROXY_TARGET.
    goto end
)

echo  App disponible en http://localhost:3000
echo  Asegurate de que el backend este corriendo en http://127.0.0.1:8000
echo.
echo  Presiona Ctrl+C para detener.
echo ============================================
echo.

call npm run dev

:end
endlocal
pause
