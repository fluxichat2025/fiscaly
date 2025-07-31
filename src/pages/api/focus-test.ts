import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    console.log('Testando conexão com Focus NFe...');

    // Testar conexão com Focus NFe
    const testResponse = await fetch('https://app-v2.focusnfe.com.br/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    console.log('Status da resposta:', testResponse.status);

    if (!testResponse.ok) {
      throw new Error(`Erro ao acessar Focus NFe: ${testResponse.status}`);
    }

    // Criar HTML simples de teste
    const testHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Teste - Focus NFe</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
            color: #374151;
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin: 20px auto;
            max-width: 600px;
          }
          .success {
            color: #28a745;
            font-weight: bold;
          }
          .btn {
            background-color: #3374dd;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
          }
          .btn:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🏢 Teste de Conexão - Focus NFe</h2>
          <p class="success">✅ Conexão com Focus NFe realizada com sucesso!</p>
          <p><strong>Status da Resposta:</strong> ${testResponse.status}</p>
          <p><strong>Teste realizado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          
          <hr>
          <h3>🚀 Próximos Passos:</h3>
          <ul>
            <li>✅ Conexão com Focus NFe estabelecida</li>
            <li>🔄 Implementar login automático</li>
            <li>🔄 Extrair dados das empresas</li>
            <li>🔄 Exibir conteúdo limpo</li>
          </ul>
          
          <hr>
          <p><strong>Credenciais Configuradas:</strong></p>
          <ul>
            <li>Email: contato@fluxiwave.com.br</li>
            <li>Senha: ********</li>
          </ul>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://app-v2.focusnfe.com.br/minhas_empresas/empresas" target="_blank" class="btn">
              👒 Abrir Focus NFe
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar headers para permitir iframe
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', 'frame-ancestors self');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(testHtml);

  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    \n    const errorHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Erro - Focus NFe</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f9fafb; }
          .error { background: white; padding: 20px; border-radius: 8px; color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Erro de Conexão</h2>
          <p>Não foi possível conectar com a Focus NFe:</p>
          <p><code>${error.message}</code></p>
        </div>
      </body>
      </html>
    `;
    
    res.status(500).send(errorHtml);
  }
}