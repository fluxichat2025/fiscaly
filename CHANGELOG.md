# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-01

### ✅ Adicionado
- **Sistema completo de NFSe** com emissão e consulta via API Focus NFe
- **Popup inteligente de resultados** com layouts diferenciados por status
- **Sistema de monitoramento em tempo real** com polling automático
- **Downloads automáticos** de XML da NFSe e cancelamento
- **Servidor proxy Node.js** baseado no código Java oficial da Focus NFe
- **Integração com Supabase** para gestão de empresas
- **Hooks personalizados** para monitoramento e popup
- **Componentes UI** com shadcn/ui e Tailwind CSS

### 🎨 Interface
- **Popup de resultados** com cores por status (verde, laranja, vermelho, azul)
- **Informações detalhadas** da NFSe (número, código verificação, data emissão)
- **Lista de erros** detalhada para status de erro_autorizacao
- **Botões de ação** para download XML e visualização na prefeitura
- **Layout responsivo** para desktop e mobile

### 🔧 Funcionalidades Técnicas
- **Polling automático** a cada 15 segundos
- **Sistema de retry** com backoff exponencial
- **Tratamento de CORS** via servidor proxy
- **Autenticação Basic Auth** com token principal
- **Mapeamento completo** de todos os status da API Focus NFe

### 📊 Status Suportados
- **autorizado**: NFSe emitida e autorizada (verde)
- **cancelado**: NFSe cancelada (laranja)
- **erro_autorizacao**: Erros na autorização (vermelho)
- **processando_autorizacao**: Processando (azul)

### 🛠️ Arquitetura
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express (servidor proxy)
- **Database**: Supabase
- **API**: Focus NFe v2
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React

### 📁 Estrutura do Projeto
```
fiscalia_webapp2/
├── src/components/NFSeResultPopup.tsx      # Popup de resultados
├── src/hooks/useNFSeMonitoring.tsx         # Hook de monitoramento
├── src/hooks/useNFSeResultPopup.tsx        # Hook do popup
├── server/nfse-proxy.js                    # Servidor proxy
└── start-proxy.bat                         # Script de inicialização
```

### 🔑 Configuração
- **Token principal**: QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe
- **URL base**: https://api.focusnfe.com.br/v2
- **Proxy local**: http://localhost:3001

### 📝 Documentação
- **README.md**: Documentação principal completa
- **server/README.md**: Documentação do servidor proxy
- **GITHUB_SETUP.md**: Guia para criação do repositório
- **CHANGELOG.md**: Este arquivo de mudanças

### 🎯 Exemplos Incluídos
- **NFSeEmissionExample.tsx**: Exemplo completo de uso
- **Scripts de inicialização**: setup-git.bat, start-proxy.bat
- **Configuração de ambiente**: .env.example

---

## Formato das Versões

- **[Major.Minor.Patch]** - Data
- **Major**: Mudanças incompatíveis na API
- **Minor**: Funcionalidades adicionadas de forma compatível
- **Patch**: Correções de bugs compatíveis

## Tipos de Mudanças

- **✅ Adicionado**: Para novas funcionalidades
- **🔄 Alterado**: Para mudanças em funcionalidades existentes
- **❌ Removido**: Para funcionalidades removidas
- **🐛 Corrigido**: Para correções de bugs
- **🔒 Segurança**: Para vulnerabilidades corrigidas
