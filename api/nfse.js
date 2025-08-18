// Serverless Function para consulta de NFSe - Vercel Compatible
// URL: /api/nfse?referencia=XXXX

const FOCUS_NFE_BASE_URL = 'https://api.focusnfe.com.br/v2';
const FOCUS_NFE_TOKEN = process.env.VITE_FOCUS_NFE_TOKEN_PRODUCAO || 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req, res) {
  const { method, query } = req;
  const { referencia } = query;

  console.log('🔍 NFSe Consulta Request:', {
    method,
    referencia,
    query,
    url: req.url,
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

  // Validar método
  if (method !== 'GET') {
    return res.status(405).json({
      error: true,
      message: 'Método não permitido. Use GET.'
    });
  }

  // Validar referência
  if (!referencia) {
    return res.status(400).json({
      error: true,
      message: 'Referência da NFSe é obrigatória. Use: /api/nfse?referencia=XXXX'
    });
  }

  try {
    // Construir URL da consulta
    const consultaUrl = `${FOCUS_NFE_BASE_URL}/nfse/${referencia}`;

    console.log('🌐 Consultando Focus NFe:', {
      url: consultaUrl,
      token: FOCUS_NFE_TOKEN ? FOCUS_NFE_TOKEN.substring(0, 10) + '...' : 'NOT_SET'
    });

    // Fazer requisição para Focus NFe
    const response = await fetch(consultaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-NFSe-Consulta/1.0',
      },
      timeout: 15000, // 15 segundos para consultas
    });

    console.log('📥 Focus NFe Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Processar resposta baseada no status
    let responseData;
    let statusCode = response.status;

    if (response.ok) {
      // NFSe encontrada e processada
      responseData = await response.json();
      
      // Adicionar informações extras
      responseData.consultadoEm = new Date().toISOString();
      responseData.fonte = 'focus-nfe-api';
      responseData.success = true;

      console.log('✅ NFSe encontrada:', {
        referencia,
        status: responseData.status,
        numero: responseData.numero || 'N/A'
      });

    } else if (response.status === 404) {
      // NFSe ainda processando ou não encontrada
      responseData = {
        status: 'processando',
        message: 'NFSe ainda está sendo processada ou não foi encontrada',
        referencia,
        consultadoEm: new Date().toISOString(),
        httpCode: 404,
        success: false
      };

      console.log('⏳ NFSe ainda processando:', referencia);

    } else if (response.status === 400) {
      // Erro de validação
      const errorText = await response.text();
      responseData = {
        error: true,
        status: 'erro_validacao',
        message: 'Erro de validação na consulta',
        details: errorText,
        referencia,
        httpCode: 400,
        success: false
      };

      console.log('❌ Erro de validação:', errorText);

    } else {
      // Outros erros
      const errorText = await response.text();
      responseData = {
        error: true,
        status: 'erro_api',
        message: 'Erro na API Focus NFe',
        details: errorText,
        referencia,
        httpCode: response.status,
        success: false
      };

      console.log('❌ Erro da API:', response.status, errorText);
    }

    return res.status(statusCode).json(responseData);

  } catch (error) {
    console.error('❌ Erro na consulta NFSe:', {
      referencia,
      error: error.message,
      stack: error.stack
    });

    // Determinar tipo de erro
    let statusCode = 500;
    let errorMessage = 'Erro interno na consulta';

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Timeout na consulta da NFSe';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      statusCode = 502;
      errorMessage = 'Erro de conexão com Focus NFe';
    }

    return res.status(statusCode).json({
      error: true,
      status: 'erro_consulta',
      message: errorMessage,
      referencia,
      timestamp: new Date().toISOString(),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
