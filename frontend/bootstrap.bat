@echo off
setlocal

echo ============================================
echo  AgroFlow Frontend - Bootstrap local
echo ============================================
echo.

cd /d "%~dp0"

REM ---- 0. Verificar Node.js ----
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encuentra Node.js en el sistema.
    echo Descargalo desde https://nodejs.org/en/download - version LTS
    goto error
)

for /f "tokens=*" %%v in ('node --version') do set "NODE_VER=%%v"
echo [1/3] Node.js detectado: %NODE_VER%

REM ---- 1. Verificar .env.local ----
if not exist ".env.local" (
    echo [ERROR] Falta frontend\.env.local con API_PROXY_TARGET.
    echo Ejemplo: API_PROXY_TARGET=http://127.0.0.1:8000
    goto error
)

REM ---- 2. Instalar dependencias ----
echo [2/3] Instalando dependencias con npm install...
call npm install
if errorlevel 1 goto error

echo [3/3] Dependencias instaladas correctamente.

echo.
echo ============================================
echo  Bootstrap completado con exito.
echo ============================================
echo.
echo  Para arrancar el frontend:
echo    cd frontend
echo    npm run dev
echo  O simplemente ejecuta start.bat
echo.
echo  App disponible en http://localhost:3000
echo ============================================
goto end

:error
echo.
echo [ERROR] Fallo un paso del bootstrap. Revisa el mensaje anterior.
goto end

:end
endlocal
pause
