// Serverless Function para proxy geral da Focus NFe - Vercel Compatible
// URL: /api/focusnfe?path=v2/empresas&method=GET

const FOCUS_NFE_BASE_URL = 'https://api.focusnfe.com.br';
const FOCUS_NFE_TOKEN = process.env.VITE_FOCUS_NFE_TOKEN_PRODUCAO || 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req, res) {
  const { method, query, body } = req;
  const { path: apiPath, ...queryParams } = query;

  console.log('🔍 Focus NFe Proxy Request:', {
    method,
    apiPath,
    queryParams,
    hasBody: !!body,
    timestamp: new Date().toISOString()
  });

  // Configurar headers CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Tratar requisições OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar path
  if (!apiPath) {
    return res.status(400).json({
      error: true,
      message: 'Path da API é obrigatório. Use: /api/focusnfe?path=v2/empresas'
    });
  }

  try {
    // Construir URL da API
    const targetUrl = `${FOCUS_NFE_BASE_URL}/${apiPath}`;

    // Adicionar query parameters se existirem
    const urlParams = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      if (key !== 'path') {
        urlParams.append(key, queryParams[key]);
      }
    });
    
    const queryString = urlParams.toString();
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    console.log('🌐 Target URL:', finalUrl);

    // Configurar headers para a requisição
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Fiscaly-App/1.0',
    };

    // Configurar opções da requisição
    const fetchOptions = {
      method,
      headers,
    };

    // Adicionar body para requisições POST/PUT
    if ((method === 'POST' || method === 'PUT') && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log('📤 Request options:', {
      method,
      url: finalUrl,
      hasBody: !!(fetchOptions.body),
      headers: { ...headers, Authorization: 'Basic [HIDDEN]' }
    });

    // Fazer a requisição para a API Focus NFe
    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('📥 Focus NFe Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // Ler o conteúdo da resposta
    const contentType = response.headers.get('content-type') || '';
    let responseData;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log('📊 Response data preview:', 
      typeof responseData === 'string' 
        ? responseData.substring(0, 200) + '...'
        : JSON.stringify(responseData).substring(0, 200) + '...'
    );

    // Preservar content-type da resposta original
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Retornar resposta com o mesmo status code
    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ Erro no proxy Focus NFe:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Determinar tipo de erro e status code apropriado
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Timeout na requisição para Focus NFe';
    } else if (error.message.includes('fetch')) {
      statusCode = 502;
      errorMessage = 'Erro de conexão com Focus NFe';
    } else if (error.message.includes('JSON')) {
      statusCode = 502;
      errorMessage = 'Resposta inválida da Focus NFe';
    }

    return res.status(statusCode).json({
      error: true,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
