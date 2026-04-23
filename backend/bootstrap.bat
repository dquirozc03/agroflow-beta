@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo  AgroFlow Backend - Bootstrap local
echo ============================================
echo.

cd /d "%~dp0"

REM ---- 0. Verificar .env.local ----
if not exist ".env.local" (
    echo [ERROR] Falta backend\.env.local con DATABASE_URL y SYNC_TOKEN.
    echo Crea el archivo antes de ejecutar este bootstrap.
    goto error
)

REM ---- 0b. Verificar que Python 3.12 este disponible ----
py -3.12 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encuentra Python 3.12 en el sistema.
    echo Verifica con: py -3.12 --version
    echo Descargalo desde https://www.python.org/downloads/release/python-31210/
    goto error
)

REM ---- 1. Crear venv con Python 3.12 (recrea si la version no es 3.12) ----
set "NEED_CREATE=1"
if exist ".venv\Scripts\python.exe" (
    for /f "tokens=2" %%v in ('".venv\Scripts\python.exe" --version 2^>^&1') do set "VENV_VER=%%v"
    echo      Venv existente detectado: Python !VENV_VER!
    echo !VENV_VER! | findstr /b "3.12" >nul
    if not errorlevel 1 (
        set "NEED_CREATE=0"
        echo [1/9] Venv con Python 3.12 ya existe, reutilizando.
    ) else (
        echo      Version incorrecta, eliminando venv anterior...
        rmdir /s /q .venv
        if exist ".venv" (
            echo [ERROR] No se pudo eliminar .venv. Cierra cualquier terminal que lo tenga activo y reintenta.
            goto error
        )
    )
)

if "!NEED_CREATE!"=="1" (
    echo [1/9] Creando entorno virtual con Python 3.12...
    py -3.12 -m venv .venv
    if errorlevel 1 goto error_python
)

REM ---- 2. Activar venv ----
echo [2/9] Activando entorno virtual...
call ".venv\Scripts\activate.bat"
if errorlevel 1 goto error

REM ---- 3. Instalar dependencias ----
echo [3/9] Actualizando pip...
python -m pip install --upgrade pip
if errorlevel 1 goto error

echo      Instalando dependencias de requirements.txt...
python -m pip install -r requirements.txt
if errorlevel 1 goto error

REM ---- 4. Alembic: auth + auditoria ----
echo [4/9] Aplicando migraciones Alembic (auth + auditoria)...
alembic upgrade head
if errorlevel 1 goto error

REM ---- 5. SQL v2: posicionamientos ----
echo [5/9] Migracion v2: posicionamientos...
python scripts\run_migracion.py
if errorlevel 1 goto error

REM ---- 6. SQL v3: pedidos ----
echo [6/9] Migracion v3: pedidos...
python -c "from app.database import engine; from sqlalchemy import text; c=engine.connect(); c.execute(text(open('sql/migracion_v3_pedidos.sql',encoding='utf-8').read())); c.commit(); c.close(); print('OK v3 pedidos')"
if errorlevel 1 goto error

REM ---- 7. SQL v4: maestros ----
echo [7/9] Migracion v4: maestros...
python -c "from app.database import engine; from sqlalchemy import text; c=engine.connect(); c.execute(text(open('sql/migracion_v4_maestros.sql',encoding='utf-8').read())); c.commit(); c.close(); print('OK v4 maestros')"
if errorlevel 1 goto error

REM ---- 8. Patches y seeds (no abortan si fallan por idempotencia) ----
echo [8/9] Aplicando patches y seeds...
python scripts\db\patch_auth_roles.py
python scripts\db\patch_json_permisos.py
python scripts\db\patch_db.py
python scripts\db\patch_db_cultivo.py
python scripts\db\patch_db_ie_aliases.py
python scripts\db\seed_plantas.py

REM ---- 9. Usuario administrador ----
echo [9/9] Creando usuario administrador...
python scripts\ops\create_admin.py

echo.
echo ============================================
echo  Bootstrap completado con exito.
echo ============================================
echo.
echo  Para arrancar el backend:
echo    cd backend
echo    .venv\Scripts\activate
echo    uvicorn app.main:app --reload
echo.
echo  API disponible en http://127.0.0.1:8000
echo  Swagger en      http://127.0.0.1:8000/docs
echo ============================================
goto end

:error_python
echo.
echo [ERROR] No se pudo crear el venv con Python 3.12.
echo Verifica con: py -3.12 --version
echo Si no lo tienes, instalalo desde https://www.python.org/downloads/release/python-31210/
goto end

:error
echo.
echo [ERROR] Fallo un paso del bootstrap. Revisa el mensaje anterior.
goto end

:end
endlocal
pause
