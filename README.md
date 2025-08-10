# 🏢 Fiscalia WebApp

Sistema completo de gestão fiscal com Kanban de tarefas, emissão de NFSe, relatórios e dashboard integrado.

## 🚀 Funcionalidades

### 📋 Kanban de Tarefas
- ✅ **Drag & Drop** entre colunas com persistência
- ✅ **Realtime instantâneo** - mudanças aparecem sem refresh
- ✅ **Cabeçalho fixo** que não se move com scroll
- ✅ **Múltiplos quadros** e templates
- ✅ **Filtros avançados** (prioridade, responsável, tags, datas)
- ✅ **Sincronização** entre Dashboard e página de Tarefas

### 🧾 Sistema NFSe
- ✅ **Emissão de NFSe** via Focus NFe API
- ✅ **Consulta simples** de notas emitidas
- ✅ **Configuração por empresa** (códigos municipais, lista de serviços)
- ✅ **Proxy server** para resolver CORS
- ✅ **Fallback strategy** com Supabase Edge Functions

### 📊 Dashboard
- ✅ **Widgets integrados** (NFSe, tarefas, relatórios)
- ✅ **Gráficos interativos** com Recharts
- ✅ **Notícias contábeis** em tempo real
- ✅ **Métricas fiscais** e KPIs

### 🎨 Interface
- ✅ **Design responsivo** com Tailwind CSS
- ✅ **Componentes shadcn/ui**
- ✅ **Dark/Light mode** support
- ✅ **Sidebar colapsível**
- ✅ **Toasts e notificações**

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **API Integration**: Focus NFe
- **Deployment**: Vercel

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Focus NFe (opcional)

### 1. Clone o repositório
```bash
git clone https://github.com/fluxichat2025/fiscalia-webapp.git
cd fiscalia-webapp
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_FOCUS_NFE_TOKEN=seu_token_focus_nfe
```

### 4. Execute as migrações do Supabase
```bash
# Instale a CLI do Supabase
npm install -g supabase

# Execute as migrações
supabase db push
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

### 6. (Opcional) Inicie o proxy server
```bash
# Em outro terminal
cd server
npm install
npm start
```

## 🏗️ Estrutura do Projeto

```
fiscalia-webapp/
├── src/
│   ├── components/          # Componentes React
│   │   ├── kanban/         # Componentes do Kanban
│   │   ├── ui/             # Componentes shadcn/ui
│   │   └── ...
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # Integrações (Supabase, Focus NFe)
│   └── utils/              # Utilitários
├── server/                 # Proxy server Node.js
├── supabase/              # Migrações e configurações
└── ...
```

## 🔧 Configuração do Supabase

### Tabelas principais:
- `boards` - Quadros Kanban
- `board_columns` - Colunas dos quadros
- `tasks` - Tarefas
- `companies` - Empresas
- `nfse_emitidas` - NFSe emitidas

### Realtime habilitado para:
- `tasks` - Sincronização instantânea de tarefas
- `board_columns` - Sincronização de colunas
- `boards` - Sincronização de quadros

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instale a CLI do Vercel
npm install -g vercel

# Deploy
vercel --prod
```

### Configurações no Vercel:
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Configure as mesmas do `.env.local`

## 📝 Uso

### Kanban de Tarefas
1. Acesse `/tarefas`
2. Crie quadros e colunas
3. Adicione tarefas
4. Arraste entre colunas
5. Use filtros para organizar

### Emissão de NFSe
1. Configure empresas em `/configuracoes`
2. Acesse `/emitir-nfse`
3. Preencha os dados
4. Emita a nota
5. Consulte em `/consultar-nfse`

### Dashboard
1. Visualize métricas na página inicial
2. Acompanhe tarefas recentes
3. Veja gráficos de performance
4. Leia notícias contábeis

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: contato@fluxichat.com.br
- 🐛 Issues: [GitHub Issues](https://github.com/fluxichat2025/fiscalia-webapp/issues)
- 📖 Documentação: [Wiki](https://github.com/fluxichat2025/fiscalia-webapp/wiki)

---

Desenvolvido com ❤️ pela equipe [FluxiChat](https://github.com/fluxichat2025)
