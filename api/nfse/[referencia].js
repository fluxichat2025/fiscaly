// Serverless Function específica para consulta de NFSe no Vercel
// Otimizada para consultas frequentes com cache

const FOCUS_NFE_BASE_URL = 'https://api.focusnfe.com.br/v2';
const FOCUS_NFE_TOKEN = process.env.VITE_FOCUS_NFE_TOKEN_PRODUCAO || 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

console.log('🔧 NFSe Function loaded:', {
  hasToken: !!FOCUS_NFE_TOKEN,
  baseUrl: FOCUS_NFE_BASE_URL,
  timestamp: new Date().toISOString()
});

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Cache simples em memória (válido durante a execução da função)
const cache = new Map();
const CACHE_TTL = 30000; // 30 segundos

export default async function handler(req, res) {
  const { method, query } = req;
  const { referencia } = query;

  console.log('🔍 NFSe Consulta Request:', {
    method,
    referencia,
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
      message: 'Referência da NFSe é obrigatória'
    });
  }

  try {
    // Verificar cache
    const cacheKey = `nfse_${referencia}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('📋 Retornando dados do cache para:', referencia);
      return res.status(200).json({
        ...cached.data,
        cached: true,
        cacheAge: Date.now() - cached.timestamp
      });
    }

    // Construir URL da consulta
    const consultaUrl = `${FOCUS_NFE_BASE_URL}/nfse/${referencia}`;

    console.log('🌐 Consultando Focus NFe:', consultaUrl);

    // Fazer requisição para Focus NFe
    const response = await fetch(consultaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${FOCUS_NFE_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-NFSe-Consulta/1.0',
      },
      timeout: 15000, // 15 segundos para consultas
    });

    console.log('📥 Focus NFe Response:', {
      status: response.status,
      statusText: response.statusText
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
      
      // Armazenar no cache
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      console.log('✅ NFSe encontrada:', {
        referencia,
        status: responseData.status,
        numero: responseData.numero
      });

    } else if (response.status === 404) {
      // NFSe ainda processando ou não encontrada
      responseData = {
        status: 'processando',
        message: 'NFSe ainda está sendo processada ou não foi encontrada',
        referencia,
        consultadoEm: new Date().toISOString(),
        httpCode: 404
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
        httpCode: 400
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
        httpCode: response.status
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Configuração do Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
  maxDuration: 20, // 20 segundos para consultas
};
