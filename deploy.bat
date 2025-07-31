@echo off
echo ========================================
echo    DEPLOY AUTOMATICO - SISTEMA FISCALIA
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha na instalacao das dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] Executando build de producao...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build de producao
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando arquivos gerados...
if not exist "dist" (
    echo ERRO: Pasta dist nao foi criada
    pause
    exit /b 1
)

echo.
echo [4/4] Build concluido com sucesso!
echo.
echo ========================================
echo    PROXIMOS PASSOS:
echo ========================================
echo 1. Acesse https://vercel.com
echo 2. Faca login com GitHub
echo 3. Clique em "New Project"
echo 4. Selecione este repositorio
echo 5. Configure as variaveis de ambiente
echo 6. Deploy automatico ativo!
echo.
echo Pasta 'dist' pronta para upload manual se necessario.
echo ========================================
pause
