@echo off
setlocal

echo ============================================
echo  AgroFlow Backend - Arranque local
echo ============================================
echo.

cd /d "%~dp0"

REM ---- Verificar venv ----
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] No existe el entorno virtual .venv
    echo Ejecuta primero bootstrap.bat para crearlo.
    goto end
)

REM ---- Verificar .env.local ----
if not exist ".env.local" (
    echo [ERROR] Falta backend\.env.local con DATABASE_URL y SYNC_TOKEN.
    goto end
)

REM ---- Activar venv ----
echo Activando entorno virtual...
call ".venv\Scripts\activate.bat"
if errorlevel 1 goto end

REM ---- Arrancar uvicorn ----
echo.
echo  API disponible en http://127.0.0.1:8000
echo  Swagger en      http://127.0.0.1:8000/docs
echo.
echo  Presiona Ctrl+C para detener.
echo ============================================
echo.

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

:end
endlocal
pause
