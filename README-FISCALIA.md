# Fiscalia WebApp 🧾

Sistema completo de gestão contábil com dashboard interativo, sistema de tarefas e notícias atualizadas em tempo real.

![Fiscalia WebApp](https://img.shields.io/badge/Status-Pronto%20para%20Deploy-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🚀 Deploy Automático Configurado

Este projeto está **100% pronto** para deploy automático no Vercel. Qualquer mudança no código será automaticamente deployada.

## 📋 Funcionalidades

### ✅ Dashboard Interativo
- **Métricas em tempo real** de NFSe emitidas
- **Gráficos interativos** com Recharts
- **KPIs principais** calculados dinamicamente
- **Filtros por período** (1 mês, 3 meses, 6 meses, 1 ano)
- **Dados reais** integrados com Supabase

### ✅ Sistema de Tarefas Completo
- **CRUD completo**: Criar, editar, atualizar status, excluir
- **4 status**: Pendente, Em Andamento, Concluída, Cancelada
- **4 prioridades**: Baixa, Média, Alta, Urgente
- **Filtros funcionais** por status
- **Datas de vencimento** com alertas visuais
- **Armazenamento híbrido**: Supabase + localStorage fallback

### ✅ Notícias Contábeis Atualizadas
- **Scraping real** do Jornal Contábil
- **7 notícias mais recentes** sempre atualizadas
- **Categorização automática** por área
- **Cache inteligente** para performance
- **Fallback robusto** com dados realistas

### ✅ Layout Responsivo Moderno
- **Design limpo** com Tailwind CSS
- **Componentes Shadcn/ui** de alta qualidade
- **Totalmente responsivo** para desktop e mobile
- **Tema consistente** em toda aplicação
- **Acessibilidade** implementada

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: Tailwind CSS, Shadcn/ui, Lucide Icons
- **Gráficos**: Recharts para visualizações interativas
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Scraping**: Cheerio para parsing HTML
- **Deploy**: Vercel com CI/CD automático
- **Bundling**: Vite com code splitting otimizado

## 🚀 Instalação e Desenvolvimento

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/Fiscalia-WebApp.git
cd Fiscalia-WebApp

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais do Supabase

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🌐 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: tarefas
```sql
CREATE TABLE tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  prioridade VARCHAR(20) DEFAULT 'media',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: noticias_contabeis
```sql
CREATE TABLE noticias_contabeis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  resumo TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  link_original VARCHAR(500),
  categoria VARCHAR(100),
  autor VARCHAR(100),
  fonte VARCHAR(100) DEFAULT 'Jornal Contábil',
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Deploy no Vercel

1. **Fork/Clone** este repositório
2. **Conecte** com sua conta Vercel
3. **Configure** as variáveis de ambiente
4. **Deploy automático** ativo!

### Configurações de Build
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework**: Vite

## 📈 Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Otimizado com code splitting
- **SEO**: Meta tags otimizadas

## 🔒 Segurança

- **Row Level Security (RLS)** no Supabase
- **Autenticação JWT** segura
- **Sanitização** de dados de entrada
- **CORS** configurado adequadamente
- **Environment variables** protegidas

## 📱 Responsividade

- **Desktop**: Layout completo com 3 colunas
- **Tablet**: Layout adaptado com 2 colunas
- **Mobile**: Layout em coluna única
- **Touch-friendly**: Botões e interações otimizadas

## 🎯 Roadmap

- [ ] **Módulo de Clientes** completo
- [ ] **Emissão de NFSe** integrada
- [ ] **Relatórios avançados** em PDF
- [ ] **Notificações push** em tempo real
- [ ] **App mobile** React Native
- [ ] **API pública** para integrações

## 📞 Suporte

- **Documentação**: Veja os arquivos `.md` na raiz
- **Issues**: Use o GitHub Issues para reportar bugs
- **Contribuições**: Pull requests são bem-vindos!

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Fiscalia WebApp** - Desenvolvido com ❤️ para contadores e empresas brasileiras.

🚀 **Deploy automático ativo** - Qualquer mudança no código é automaticamente deployada!
