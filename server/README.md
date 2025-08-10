# Servidor Proxy NFSe

Este servidor proxy foi criado baseado no código Java oficial da Focus NFe para resolver problemas de CORS e garantir que as consultas NFSe funcionem corretamente.

## Como Funciona

O servidor replica exatamente a lógica do código Java oficial:

```java
// Código Java original da Focus NFe
String login = "Token_enviado_pelo_suporte";
String ref = "12345";
String server = "https://api.focusnfe.com.br/";
String url = server.concat("v2/nfse/"+ref);

Object config = new DefaultClientConfig();
Client client = Client.create((ClientConfig) config);
client.addFilter(new HTTPBasicAuthFilter(login, ""));

WebResource request = client.resource(url);
ClientResponse resposta = (ClientResponse) request.get(ClientResponse.class);
```

## Instalação e Uso

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Iniciar o servidor
```bash
npm start
```

Ou use o script automático:
```bash
# Na raiz do projeto
start-proxy.bat
```

### 3. Verificar se está funcionando
```bash
curl http://localhost:3001/api/health
```

## Endpoints

### Health Check
- **URL**: `GET /api/health`
- **Resposta**: Status do servidor

### Consulta NFSe
- **URL**: `GET /api/nfse/{referencia}`
- **Parâmetros**: 
  - `referencia`: Número de referência da NFSe
- **Resposta**: 
  ```json
  {
    "status": "sucesso|processando|erro",
    "data": {...},
    "message": "...",
    "httpCode": 200
  }
  ```

## Configuração

O token principal está configurado no arquivo `nfse-proxy.js`:

```javascript
const TOKEN_PRINCIPAL = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
```

## Logs

O servidor produz logs detalhados para debug:

```
🔍 Fazendo requisição HTTPS: { url: '...', hostname: '...', path: '...' }
📥 Resposta recebida: { statusCode: 200, headers: {...}, body: '...' }
📋 Resultado da consulta: { httpCode: 200, bodyLength: 1234 }
```

## Tratamento de Status

- **200-299**: Sucesso - retorna os dados da NFSe
- **404**: NFSe ainda processando - retorna status "processando"
- **400+**: Erro - retorna mensagem de erro

## Vantagens

1. **Baseado no código oficial**: Replica exatamente a lógica do Java
2. **Sem problemas de CORS**: Servidor backend faz as requisições
3. **HTTP Basic Auth correto**: Implementação idêntica ao Jersey Client
4. **Logs detalhados**: Para debug e troubleshooting
5. **Tratamento robusto**: Handles todos os status codes corretamente
