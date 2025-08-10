@echo off
echo 🚀 Iniciando servidor proxy NFSe...
echo.

cd server

echo 📦 Verificando se as dependências estão instaladas...
if not exist node_modules (
    echo 📥 Instalando dependências...
    npm install
) else (
    echo ✅ Dependências já instaladas
)

echo.
echo 🔄 Iniciando servidor proxy na porta 3001...
echo 🔗 Health check: http://localhost:3001/api/health
echo 🔗 Consulta NFSe: http://localhost:3001/api/nfse/{referencia}
echo.
echo ⚠️  Mantenha esta janela aberta enquanto usar o sistema
echo.

npm start
