// Serverless Function principal para todas as APIs - Vercel Compatible
// Roteamento manual para diferentes endpoints

const FOCUS_NFE_BASE_URL = 'https://api.focusnfe.com.br/v2';
const FOCUS_NFE_TOKEN = process.env.VITE_FOCUS_NFE_TOKEN_PRODUCAO || 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req, res) {
  const { method, query, url } = req;

  console.log('🔍 API Request:', {
    method,
    url,
    query,
    timestamp: new Date().toISOString()
  });

  // Configurar headers CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Tratar requisições OPTIONS
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Roteamento baseado na URL
    if (url.includes('/api/nfse')) {
      return await handleNFSeConsulta(req, res);
    } else if (url.includes('/api/focusnfe')) {
      return await handleFocusNFeProxy(req, res);
    } else {
      return res.status(404).json({
        error: true,
        message: 'Endpoint não encontrado',
        availableEndpoints: [
          '/api/nfse?referencia=XXX',
          '/api/focusnfe?path=v2/empresas'
        ]
      });
    }
  } catch (error) {
    console.error('❌ Erro geral na API:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

// Handler para consulta de NFSe
async function handleNFSeConsulta(req, res) {
  const { query } = req;
  const { referencia } = query;

  console.log('📄 NFSe Consulta:', { referencia });

  if (!referencia) {
    return res.status(400).json({
      error: true,
      message: 'Referência da NFSe é obrigatória. Use: /api/nfse?referencia=XXX'
    });
  }

  try {
    const consultaUrl = `${FOCUS_NFE_BASE_URL}/nfse/${referencia}`;
    
    console.log('🌐 Consultando:', consultaUrl);

    const response = await fetch(consultaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-NFSe/1.0',
      },
    });

    console.log('📥 Response:', response.status);

    let responseData;
    
    if (response.ok) {
      responseData = await response.json();
      responseData.consultadoEm = new Date().toISOString();
      responseData.success = true;
    } else if (response.status === 404) {
      responseData = {
        status: 'processando',
        message: 'NFSe ainda está sendo processada ou não foi encontrada',
        referencia,
        consultadoEm: new Date().toISOString(),
        success: false
      };
    } else {
      const errorText = await response.text();
      responseData = {
        error: true,
        status: 'erro_api',
        message: 'Erro na API Focus NFe',
        details: errorText,
        referencia,
        success: false
      };
    }

    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ Erro NFSe:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro na consulta NFSe',
      referencia,
      details: error.message
    });
  }
}

// Handler para proxy geral Focus NFe
async function handleFocusNFeProxy(req, res) {
  const { method, query, body } = req;
  const { path: apiPath, ...queryParams } = query;

  console.log('🔧 Focus NFe Proxy:', { method, apiPath, queryParams });

  if (!apiPath) {
    return res.status(400).json({
      error: true,
      message: 'Path da API é obrigatório. Use: /api/focusnfe?path=v2/empresas'
    });
  }

  try {
    const targetUrl = `${FOCUS_NFE_BASE_URL.replace('/v2', '')}/${apiPath}`;
    
    // Adicionar query parameters
    const urlParams = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      urlParams.append(key, queryParams[key]);
    });
    
    const queryString = urlParams.toString();
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    console.log('🌐 Target URL:', finalUrl);

    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-Proxy/1.0',
      },
    };

    if ((method === 'POST' || method === 'PUT') && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('📥 Proxy Response:', response.status);

    const contentType = response.headers.get('content-type') || '';
    let responseData;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ Erro Proxy:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro no proxy Focus NFe',
      details: error.message
    });
  }
}
