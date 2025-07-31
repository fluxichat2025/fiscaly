import { NextApiRequest, NextApiResponse } from 'next';
import httpsProxyAgent from 'https-proxy-agent';

// Credenciais da Focus NFe
const FOCUS_EMAIL = 'contato@fluxiwave.com.br';
const FOCUS_PASSWORD = 'Gpv@162017';
const FOCUS_BASE_URL = 'https://app-v2.focusnfe.com.br';

// Sessão para manter cookies
let sessionCookies: string = '';

// Função para fazer login na Focus NFe
async function loginFocusNFe(): Promise<boolean> {
  try {
    console.log('Iniciando login na Focus NFe...');

    // Primeiro fazer GET na página de login para obter CSRF token
    const loginPageResponse = await fetch(`${FOCUS_BASE_URL}/login`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });

    // Extrair cookies da resposta
    const setCookieHeaders = loginPageResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      sessionCookies = setCookieHeaders;
    }

    const html = await loginPageResponse.text();

    // Extrair CSRF token do HTML
    const csrfMatch = html.match(/<meta\\s+name="csrf-token"\\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    console.log('CSRF token obtido:', csrfToken ? 'Sim' : 'Não');

    // Fazer POST para login
    const loginResponse = await fetch(`${FOCUS_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': `${FOCUS_BASE_URL}/login`,
        'Cookie': sessionCookies,
        'X-CSRF-TOKEN': csrfToken
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
      sessionCookies = newCookies;
    }

    console.log('Login response status:', loginResponse.status);

    // Verificar se o login foi bem-sucedido
    if (loginResponse.status === 302 || loginResponse.ok) {
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

// Função para fazer proxy das requisições
async function proxyRequest(url: string, method: string = 'GET') {
  try {
    const response = await fetch(`${FOCUS_BASE_URL}${url}`, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cookie': sessionCookies
      }
    });

    return response;
  } catch (error) {
    console.error('Erro no proxy:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { action, url } = query;

  try {
    switch (action) {
      case 'login':
        const loginSuccess = await loginFocusNFe();
        if (loginSuccess) {
          res.status(200).json({ success: true, message: 'Login realizado com sucesso' });
        } else {
          res.status(401).json({ success: false, error: 'Falha no login' });
        }
        break;

      case 'proxy':
        if (!url || typeof url !== 'string') {
          res.status(400).json({ error: 'URL é obrigatória' });
          return;
        }

        // Fazer login se ainda não foi feito
        if (!sessionCookies) {
          await loginFocusNFe();
        }

        const proxyResponse = await proxyRequest(url, method);
        const content = await proxyResponse.text();

        // Configurar headers de resposta
        res.setHeader('Content-Type', proxyResponse.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.status(proxyResponse.status).send(content);
        break;

      default:
        res.status(400).json({ error: 'Ação não reconhecida' });
    }
  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}