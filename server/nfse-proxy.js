const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Token principal da Focus NFe (equivalente ao login no código Java)
const TOKEN_PRINCIPAL = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Função para fazer requisição HTTPS (equivalente ao Jersey Client do Java)
function makeHttpsRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    // Configuração da requisição (equivalente ao HTTPBasicAuthFilter do Java)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FocusNFe-Proxy-Server'
      }
    };

    console.log('🔍 Fazendo requisição HTTPS:', {
      url: url,
      hostname: options.hostname,
      path: options.path,
      token: token.substring(0, 10) + '...'
    });

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('📥 Resposta recebida:', {
          statusCode: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 200) + (body.length > 200 ? '...' : '')
        });

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição HTTPS:', error);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.error('❌ Timeout na requisição');
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });

    req.end();
  });
}

// Endpoint para consulta de NFSe (replicando a lógica do código Java)
app.get('/api/nfse/:referencia', async (req, res) => {
  try {
    const { referencia } = req.params;
    
    console.log('🔍 Consultando NFSe via proxy:', referencia);
    
    // URL da API Focus NFe (equivalente ao server + url do Java)
    // Para produção: https://api.focusnfe.com.br/
    const server = 'https://api.focusnfe.com.br/';
    const url = `${server}v2/nfse/${referencia}`;
    
    console.log('🌐 URL da consulta:', url);
    
    // Fazer a requisição (equivalente ao Jersey Client do Java)
    const response = await makeHttpsRequest(url, TOKEN_PRINCIPAL);
    
    // Processar a resposta (equivalente ao tratamento do ClientResponse do Java)
    const httpCode = response.statusCode;
    const body = response.body;
    
    console.log('📋 Resultado da consulta:', {
      httpCode: httpCode,
      bodyLength: body.length
    });
    
    // Se for 404, a NFSe ainda está processando
    if (httpCode === 404) {
      return res.status(200).json({
        status: 'processando',
        message: 'NFSe ainda não processada',
        httpCode: httpCode
      });
    }
    
    // Se for sucesso (200-299)
    if (httpCode >= 200 && httpCode < 300) {
      try {
        const data = JSON.parse(body);

        console.log('📊 Dados da NFSe:', data);
        console.log('📊 Status da NFSe:', data.status);

        // Verificar status da NFSe
        if (data.status === 'processando_autorizacao') {
          return res.status(200).json({
            status: 'processando',
            message: 'NFSe sendo processada pelo provedor',
            httpCode: 404,
            data: data
          });
        }

        // NFSe com status final (autorizado, erro_autorizacao, etc.)
        return res.status(200).json({
          status: 'sucesso',
          data: data,
          httpCode: httpCode
        });
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        return res.status(200).json({
          status: 'erro',
          message: 'Resposta inválida da API',
          rawBody: body,
          httpCode: httpCode
        });
      }
    }
    
    // Se for erro (400+)
    let errorData;
    try {
      errorData = JSON.parse(body);
    } catch {
      errorData = { mensagem: body || `Erro HTTP: ${httpCode}` };
    }
    
    return res.status(200).json({
      status: 'erro',
      message: errorData.mensagem || `Erro HTTP: ${httpCode}`,
      data: errorData,
      httpCode: httpCode
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint de consulta NFSe:', error);
    
    return res.status(500).json({
      status: 'erro',
      message: error.message || 'Erro interno do servidor',
      error: error.toString()
    });
  }
});

// Endpoint para download de XML
app.post('/api/download-xml', async (req, res) => {
  try {
    const { caminho, tipo } = req.body;

    if (!caminho) {
      return res.status(400).json({
        status: 'erro',
        message: 'Caminho do arquivo é obrigatório'
      });
    }

    console.log('📥 Solicitação de download XML:', { caminho, tipo });

    // URL da API Focus NFe para download
    const server = 'https://api.focusnfe.com.br/';
    const url = `${server}${caminho.startsWith('/') ? caminho.substring(1) : caminho}`;

    console.log('🌐 URL de download:', url);

    // Fazer a requisição para obter o XML
    const response = await makeHttpsRequest(url, TOKEN_PRINCIPAL);

    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({
        status: 'erro',
        message: `Erro ao baixar arquivo: ${response.statusCode}`,
        httpCode: response.statusCode
      });
    }

    // Definir headers para download
    const fileName = tipo === 'nfse' ? 'nfse.xml' : 'cancelamento.xml';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(response.body));

    // Enviar o conteúdo do XML
    res.send(response.body);

    console.log('✅ Download XML enviado com sucesso');

  } catch (error) {
    console.error('❌ Erro no endpoint de download XML:', error);

    res.status(500).json({
      status: 'erro',
      message: error.message || 'Erro interno do servidor',
      error: error.toString()
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy NFSe funcionando',
    timestamp: new Date().toISOString()
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy NFSe rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Consulta NFSe: http://localhost:${PORT}/api/nfse/{referencia}`);
});

module.exports = app;
