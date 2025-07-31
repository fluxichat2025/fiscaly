import { NextApiRequest, NextApiResponse } from 'next';

// Credenciais da Focus NFe
const FOCUS_EMAIL = 'contato@fluxiwave.com.br';
const FOCUS_PASSWORD = 'Gpv@162017';
const FOCUS_BASE_URL = 'https://app-v2.focusnfe.com.br';
const FOCUS_LOGIN_URL = `${FOCUS_BASE_URL}/login`;
const FOCUS_EMPRESAS_URL = `${FOCUS_BASE_URL}/minhas_empresas/empresas`;

// Armazenar cookies de sessão
let sessionCookies: string = '';
let lastLoginTime: number = 0;

const LOGIN_EXPIP��_TIME = 60 * 60 * 1000; // 1 hora

// Função para fazer login e obter cookies
async function authenticateFocusNFe(): Promise<boolean> {
  try {
    // Verificar se jC temos uma sessão válida
    const now = Date.now();
    if (sessionCookies && (now - lastLoginTime) < LOGIN_EXPIRY_TIME) {
      console.log('Usando sessão existente');
      return true;
    }

    console.log('Iniciando novo login na Focus NFe...');

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
      const cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      sessionCookies = cookies;
    }

    const html = await loginPageResponse.text();

    // Extrair CSRF token do HTML
    const csrfMatch = html.match(/<meta\\s+name="csrf-token"\\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

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

    if (loginResponse.status === 302 || loginResponse.ok) {
      lastLoginTime = now;
      console.log('Login realizado com sucesso!');
      return true;
    } else {
      console.error('Falha no login:', loginResponse.status);
      return false;
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
}

// Função para extrair apenas o conteúdo da tabela de empresas
async function fetchEmpresasContent(): Promise<string | null> {
  try {
    // Fazer login se necessário
    const loginSuccess = await authenticateFocusNFe();
    if (!loginSuccess) {
      return null;
    }

    // Acessar a página de empresas
    const empresasResponse = await fetch(FOCUS_EMPRESAS_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cookie': sessionCookies,
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      }
    });

    if (!empresasResponse.ok) {
      console.error('Erro ao acessar página de empresas:', empresasResponse.status);
      return null;
    }

    const html = await empresasResponse.text();

    // Extrair apenas o conteúdo da tabela de empresas
    // Vamos procurar pela seção de empresas
    const empresasSectionMatch = html.match(/<div[^>]*class=["'][^"]*empresas[^"]*["'][^>]*>([\\s\\S]*?)<\/div>/i);
    
    if (!empresasSectionMatch) {
      // Se não encontrar a seção específica, vamos procurar por a tabela
      const tableMatch = html.match(/<table[^>]*>([\\s\\S]*?)<\/table>/i);
      if (tableMatch) {
        return createCleanHtml(tableMatch[0]);
      }
    } else {
      return createCleanHtml(empresasSectionMatch[0]);
    }

    // Se não encontrar nada específico, vamos extrair o conteúdo principal
    const mainContentMatch = html.match(/<main[^>]*>([\\s\\S]*?)<\/main>/i) ||
                                 html.match(/<div[^>]*class=["'][^"]*content[^"]*["'][^>]*>([\\s\\S]*?)<\/div>/i) ||
                                 html.match(/<div[^>]*class=["'][^"]*container[^"]*["'][^>]*>([\\s\\S]*?)<\/div>/i);

    if (mainContentMatch) {
      return createCleanHtml(mainContentMatch[0]);
    }

    // Se nada funcionar, retornar o HTML completo com filtros
    return createCleanHtml(html);

  } catch (error) {
    console.error('Erro ao buscar conteúdo de empresas:', error);
    return null;
  }
}

// Função para criar HTML limpo com estilos
function createCleanHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Empresas - Focus NFe</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
          color: #374151;
        }
        
        /* Esconder elementos de navegação e menu */
        nav, .sidebar, .header, .navbar, .menu, .navigation {
          display: none !important;
        }
        
        /* Estilos para tabelas */
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        th {
          background-color: #f7f8f9;
          font-weight: 600;
          color: #374151;
        }
        
        tr:hover {
          background-color: #f9fafb;
        }
        
        /* Estilos para botões */
        .btn, .button {
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
          margin: 2px;
        }
        
        .btn-primary {
          background-color: #33374d;
          color: white;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-success {
          background-color: #28a745;
          color: white;
        }
        
        .btn-danger {
          background-color: #dc3545;
          color: white;
        }
        
        /* Estilos para formulários */
        .form-control, input, select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }
        
        /* Estilos para cartões */
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        /* Remover elementos desnecessários */
        .footer, .breadcrumb, .alert, .modal {
          display: none !important;
        }
        
        /* Estilos responsivos */
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          
          table {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px 10px;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    console.log('Buscando conteúdo de empresas da Focus NFe...');

    const content = await fetchEmpresasContent();

    if (!content) {
      res.status(500).json({ 
        error: 'Erro ao buscar conteúdo da Focus NFe',
        message: 'N\u00e3o foi poss\u00fdvel fazer login ou buscar os dados das empresas'
      });
      return;
    }

    // Configurar headers para permitir iframe
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', 'frame-ancestors self');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(content);
  } catch (error) {
    console.error('Erro na API de empresas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Erro ao processar solicitação'
    });
  }
}