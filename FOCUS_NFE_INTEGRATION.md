# IntegraÃ§Ã£o Focus NFe - DocumentaÃ§Ã£o

Esta documentaÃ§Ã£o descreve como usar a integraÃ§Ã£o com a API Focus NFe implementada no sistema de contabilidade.

## VisÃ£o Geral

A integraÃ§Ã£o permite:
- âœ… Criar e gerenciar empresas na Focus NFe
- âœ… Emitir NFSe (Nota Fiscal de ServiÃ§os EletrÃ´nica)
- âœ… Consultar status de NFSe
- âœ… Cancelar NFSe
- âœ… HistÃ³rico completo de emissÃµes
- âœ… Dashboard com estatÃ­sticas
- âœ… Tratamento robusto de erros
- âœ… ValidaÃ§Ãµes em tempo real

## ConfiguraÃ§Ã£o Inicial

### 1. Obter Tokens da Focus NFe

1. Acesse [Focus NFe](https://focusnfe.com.br/)
2. Crie uma conta ou faÃ§a login
3. Obtenha os tokens de homologaÃ§Ã£o e produÃ§Ã£o
4. Prepare o certificado digital da empresa (.pfx ou .p12)

### 2. Configurar no Sistema

1. Acesse **Prestadores** no menu principal
2. Clique no Ã­cone de configuraÃ§Ãµes (âš™ï¸) da empresa desejada
3. VÃ¡ para a aba **ConfiguraÃ§Ã£o**
4. Preencha os tokens de acesso
5. Se for a primeira configuraÃ§Ã£o, faÃ§a upload do certificado digital
6. Clique em **Criar na Focus NFe** (apenas na primeira vez)
7. Teste a conexÃ£o
8. Salve a configuraÃ§Ã£o

## Funcionalidades

### Dashboard

O dashboard fornece uma visÃ£o geral das NFSe emitidas:

- **Total de NFSe**: Quantidade total emitida
- **NFSe Autorizadas**: Quantidade autorizada com sucesso
- **NFSe Processando**: Quantidade aguardando processamento
- **NFSe com Erro**: Quantidade com erro de autorizaÃ§Ã£o
- **Valor Total**: Soma dos valores autorizados
- **Comparativo Mensal**: Crescimento mÃªs a mÃªs
- **Taxa de Sucesso**: Percentual de autorizaÃ§Ã£o

### EmissÃ£o de NFSe

Para emitir uma NFSe:

1. VÃ¡ para a aba **Emitir NFSe**
2. Preencha os dados do tomador:
   - Tipo (Pessoa FÃ­sica ou JurÃ­dica)
   - Documento (CPF/CNPJ)
   - Nome/RazÃ£o Social
   - Email (opcional)
3. Adicione os serviÃ§os:
   - DescriÃ§Ã£o detalhada
   - Quantidade
   - Valor unitÃ¡rio
   - AlÃ­quota de ISS
   - ISS retido (se aplicÃ¡vel)
4. Configure as opÃ§Ãµes:
   - Natureza da operaÃ§Ã£o
   - Optante Simples Nacional
   - Incentivador Cultural
5. Clique em **Emitir NFSe**

### HistÃ³rico de NFSe

O histÃ³rico permite:

- **Visualizar** todas as NFSe emitidas
- **Filtrar** por tomador, nÃºmero ou referÃªncia
- **Atualizar status** individualmente
- **Baixar PDF/XML** das NFSe autorizadas
- **Ver detalhes** completos de cada emissÃ£o
- **EstatÃ­sticas** resumidas

### Status das NFSe

- **ðŸŸ¡ Processando**: NFSe enviada, aguardando processamento
- **ðŸŸ¢ Autorizada**: NFSe autorizada com sucesso
- **ðŸ”´ Erro**: NFSe rejeitada (verificar mensagem de erro)
- **âš« Cancelada**: NFSe cancelada

## Estrutura TÃ©cnica

### Arquivos Principais

```
src/integrations/focusnfe/
â”œâ”€â”€ types.ts              # Tipos TypeScript
â”œâ”€â”€ client.ts             # Cliente HTTP
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ empresas.ts       # ServiÃ§os de empresas
â”‚   â””â”€â”€ nfse.ts          # ServiÃ§os de NFSe
â””â”€â”€ utils/
    â”œâ”€â”€ validators.ts     # ValidaÃ§Ãµes
    â”œâ”€â”€ formatters.ts     # Formatadores
    â””â”€â”€ errorHandler.ts   # Tratamento de erros

src/components/
â”œâ”€â”€ FocusNFeConfig.tsx           # ConfiguraÃ§Ã£o bÃ¡sica
â”œâ”€â”€ FocusNFeAdvancedConfig.tsx   # ConfiguraÃ§Ã£o avanÃ§ada
â”œâ”€â”€ FocusNFeDashboard.tsx        # Dashboard
â”œâ”€â”€ NFSeEmission.tsx             # EmissÃ£o de NFSe
â””â”€â”€ NFSeHistory.tsx              # HistÃ³rico

src/hooks/
â””â”€â”€ useFocusNFe.ts              # Hook personalizado
```

### Banco de Dados

Novos campos na tabela `companies`:
- `focus_nfe_empresa_id`: ID da empresa na Focus NFe
- `focus_nfe_token_homologacao`: Token de homologaÃ§Ã£o
- `focus_nfe_token_producao`: Token de produÃ§Ã£o
- `focus_nfe_habilitado`: Status da integraÃ§Ã£o

Nova tabela `nfse_history`:
- HistÃ³rico completo de NFSe emitidas
- Status, valores, tomadores, etc.
- ReferÃªncias para download de PDF/XML

## ValidaÃ§Ãµes Implementadas

### Documentos
- âœ… CNPJ com dÃ­gitos verificadores
- âœ… CPF com dÃ­gitos verificadores
- âœ… CEP com 8 dÃ­gitos
- âœ… Email com formato vÃ¡lido

### Tokens
- âœ… MÃ­nimo 32 caracteres
- âœ… Formato alfanumÃ©rico

### NFSe
- âœ… Data de emissÃ£o obrigatÃ³ria
- âœ… CNPJ do prestador vÃ¡lido
- âœ… RazÃ£o social do tomador obrigatÃ³ria
- âœ… Pelo menos um serviÃ§o
- âœ… Valor dos serviÃ§os > 0

## Tratamento de Erros

O sistema trata automaticamente:

### Erros de AutenticaÃ§Ã£o
- Token invÃ¡lido ou expirado
- PermissÃ£o negada

### Erros de Empresa
- Empresa nÃ£o habilitada
- Empresa nÃ£o encontrada

### Erros de Certificado
- Certificado invÃ¡lido
- Certificado vencido
- Senha incorreta

### Erros de NFSe
- NFSe nÃ£o autorizada
- Dados invÃ¡lidos
- Justificativa de cancelamento invÃ¡lida

### Erros de ConexÃ£o
- Falha na conexÃ£o
- Timeout
- Limite de requisiÃ§Ãµes

## Ambientes

### HomologaÃ§Ã£o
- URL: `https://homologacao.focusnfe.com.br`
- Para testes sem valor fiscal
- NFSe emitidas nÃ£o tÃªm validade

### ProduÃ§Ã£o
- URL: `https://api.focusnfe.com.br`
- Para emissÃµes com valor fiscal
- NFSe emitidas tÃªm validade legal

## Suporte

### Logs
Todos os erros sÃ£o logados automaticamente com:
- CÃ³digo do erro
- Mensagem detalhada
- Contexto da operaÃ§Ã£o
- Timestamp

### Retry AutomÃ¡tico
O sistema tenta novamente automaticamente para:
- Erros de conexÃ£o
- Timeouts
- Erros internos do servidor
- Limite de requisiÃ§Ãµes

### Monitoramento
- Dashboard com estatÃ­sticas em tempo real
- Alertas visuais para erros
- Progresso da configuraÃ§Ã£o
- Status de conectividade

## PrÃ³ximos Passos

Para expandir a integraÃ§Ã£o:

1. **Webhooks**: Receber notificaÃ§Ãµes automÃ¡ticas
2. **RelatÃ³rios**: RelatÃ³rios fiscais detalhados
3. **Backup**: Backup automÃ¡tico de XMLs
4. **Lote**: EmissÃ£o em lote
5. **IntegraÃ§Ã£o ContÃ¡bil**: SincronizaÃ§Ã£o com sistema contÃ¡bil

## Troubleshooting

### Problema: Token invÃ¡lido
**SoluÃ§Ã£o**: Verifique se o token tem pelo menos 32 caracteres e estÃ¡ correto

### Problema: Certificado rejeitado
**SoluÃ§Ã£o**: Verifique se o arquivo Ã© .pfx/.p12 e a senha estÃ¡ correta

### Problema: NFSe nÃ£o autorizada
**SoluÃ§Ã£o**: Verifique os dados obrigatÃ³rios e mensagem de erro da SEFAZ

### Problema: ConexÃ£o falha
**SoluÃ§Ã£o**: Verifique a conexÃ£o com internet e status da Focus NFe

---

**Desenvolvido para o Sistema de Contabilidade Pulse**  
IntegraÃ§Ã£o Focus NFe v1.0
