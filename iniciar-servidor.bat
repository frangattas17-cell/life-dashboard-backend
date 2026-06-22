@echo off
echo.
echo  *** Life Dashboard Pro - Iniciando servidor ***
echo.

cd /d "%~dp0"

:: Verificar que existe el .env
if not exist ".env" (
  echo  ERROR: No encontre el archivo .env
  echo.
  echo  Crea un archivo llamado ".env" en esta carpeta con:
  echo  ANTHROPIC_API_KEY=tu-clave-aqui
  echo.
  echo  Podes copiar .env.example y completarlo.
  pause
  exit
)

:: Cargar variables del .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
  if not "%%a"=="" if not "%%b"=="" set %%a=%%b
)

:: Instalar dependencias si no existen
if not exist "node_modules" (
  echo  Instalando dependencias por primera vez...
  npm install
  echo.
)

echo  Iniciando servidor en http://localhost:3000
echo  (Ctrl+C para detener)
echo.
node server.js
pause
