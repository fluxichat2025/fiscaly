import { NextApiRequest, NextApiResponse } from 'next';

// Credenciais da Focus NFe
const FOCUS_EMAIL = 'contato@fluxiwave.com.br';
const FOCUS_PASSWORD = 'Gpv@162017';
const FOCUS_BASE_URL = 'https://app-v2.focusnfe.com.br';
const FOCUS_LOGIN_URL = `${FOCUS_BASE_URL}/login`;
const FOCUS_EMPRESAS_URL = `${FOCUS_BASE_URL}/minhas_empresas/empresas`;

// Armazenar cookies de sessão
let sessionCookies: string = '';

// Função para fazer login e obter cookies
async function authenticateFocusNFe(): Promise<boolean> {
  try {
    console.log('Iniciando autenticação na Focus NFe...');

    // Primeiro, fazer GET na página de login para obter CSRF token
    const loginPageResponse = await fetch(FOCUS_LOGIN_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    // Extrair cookies da resposta
    const setCookieHeaders = loginPageResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      // Extrair apenas os valores dos cookies
      const cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      sessionCookies = cookies;
    }

    const html = await loginPageResponse.text();

    // Extrair CSRF token do HTML
    const csrfMatch = html.match(/<meta\\s+name="csrf-token"\\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    console.log('CSRF token obtido:', csrfToken ? 'Sim' : 'Não');

    // Fazer POST para login
    const loginResponse = await fetch(FOCUS_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': FOCUS_LOGIN_URL,
        'Origin': FOCUS_BASE_URL,
        'Cookie': sessionCookies,
        'X-CSRF-TOKEN': csrfToken,
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      },
      body: new URLSearchParams({
        email: FOCUS_EMAIL,
        password: FOCUS_PASSWORD,
        _token: csrfToken
      }).toString()
    });

    // Atualizar cookies de sessão
    const newCookies = loginResponse.headers.get('set-cookie');
    if (newCookies) {
      const additionalCookies = newCookies.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      sessionCookies += '; ' + additionalCookies;
    }

    console.log('Login response status:', loginResponse.status);

    // Verificar se o login foi bem-sucedido
    if (loginResponse.status === 302 || loginResponse.ok) {
      console.log('Autenticação realizada com sucesso!');
      return true;
    } else {
      console.error('Falha na autenticação:', loginResponse.status);
      return false;
    }
  = catch (error) {
    console.error('Erro na autenticação:', error);
    return false;
  }
}

// Função para gerar URL de login automático
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    // Gerar HTML para auto-login
    const autoLoginHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Login Automático - Focus NFe</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .loading-container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2 10px rgba(0,0,0,0.1);
          }
          .spinner {
            border: 4px solid #f4f4f4;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loading-container">
          <div class="spinner"></div>
          <h1>Fazendo login na Focus NFe...</h1>
          <p>Aguarde enquanto redirecionamos você automaticamente.</p>
        </div>

        <form id="auto-login-form" method="POST" action="${FOCUS_LOGIN_URL}" style="display: none;">
          <input type="email" name="email" value="${FOCUS_EMAIL}">
          <input type="password" name="password" value="${FOCUS_PASSWORD}">
        </form>

        <script>
          // Auto-submit após 3 segundos
          setTimeout(function() {
            document.getElementById('auto-login-form').submit();
          }, 3000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(autoLoginHtml);
  } else if (method === 'POST') {
    // Fazer autenticação
    const success = await authenticateFocusNFe();
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Autenticação realizada com sucesso',
        redirectUrl: FOCUS_EMPRESAS_URL,
        cookies: sessionCookies
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Falha na autenticação' 
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}