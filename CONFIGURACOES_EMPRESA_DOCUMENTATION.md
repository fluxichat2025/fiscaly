# 🏢 Sistema de Configurações - Aba Empresa

## 🎯 Visão Geral

A aba Empresa foi completamente reformulada para focar em **dados corporativos essenciais**, removendo as seções de Configurações Fiscais, Localização e Backup conforme solicitado. Agora oferece uma interface moderna e funcional para gerenciar todas as informações da empresa de forma organizada e eficiente.

## ✨ Funcionalidades Implementadas

### 🏗️ **Estrutura Reorganizada**

#### **❌ Seções Removidas:**
- ~~Configurações Fiscais~~ (removido)
- ~~Localização~~ (removido) 
- ~~Backup~~ (removido)

#### **✅ Novas Seções Aprimoradas:**
1. **Dados Básicos da Empresa**
2. **Endereço da Empresa**
3. **Contatos da Empresa**
4. **Dados Fiscais** (essenciais)
5. **Dados Bancários**

### 📋 **1. Dados Básicos da Empresa**

#### **🖼️ Logo da Empresa**
- **Upload funcional** para Supabase Storage
- **Preview em tempo real** do logo atual
- **Bucket dedicado** (`company-logos`) com políticas de segurança
- **Formatos suportados**: JPG, PNG, GIF
- **Fallback** para ícone padrão quando não há logo

#### **📝 Informações Corporativas**
- **Razão Social** * (obrigatório)
- **Nome Fantasia** (opcional)
- **CNPJ** * com máscara automática (00.000.000/0000-00)
- **Atividade Principal** (descrição do negócio)
- **Capital Social** (valor numérico)
- **Data de Abertura** (seletor de data)

### 🏠 **2. Endereço da Empresa**

#### **📍 Busca Automática por CEP**
- **Integração com ViaCEP** para preenchimento automático
- **Máscara de CEP** (00000-000)
- **Preenchimento automático** de: Endereço, Bairro, Cidade, Estado

#### **📋 Campos de Endereço**
- **CEP** * com busca automática
- **Estado** (2 caracteres, maiúsculo automático)
- **Endereço** * (rua, avenida, etc.)
- **Número** (número do imóvel)
- **Complemento** (sala, andar, etc.)
- **Bairro** (preenchido automaticamente via CEP)
- **Cidade** (preenchida automaticamente via CEP)

### 📞 **3. Contatos da Empresa**

#### **📱 Informações de Contato**
- **Telefone Principal** com máscara (11) 99999-9999
- **Email Corporativo** com validação de formato
- **Website** (URL completa da empresa)

### 📊 **4. Dados Fiscais (Essenciais)**

#### **🏛️ Informações Tributárias**
- **Regime Tributário** (Simples Nacional, Lucro Presumido, Lucro Real, MEI)
- **Inscrição Estadual** (formato livre)
- **Inscrição Municipal** (formato livre)

### 💳 **5. Dados Bancários**

#### **🏦 Informações Bancárias**
- **Banco Principal** (nome do banco)
- **Agência** (código da agência)
- **Conta** (número da conta)

## 🗄️ **Estrutura do Banco de Dados**

### **Tabela `company_info` Criada:**

```sql
CREATE TABLE company_info (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Dados básicos
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  logo_url TEXT,
  
  -- Endereço
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  
  -- Contatos
  telefone TEXT,
  email_corporativo TEXT,
  website TEXT,
  
  -- Dados fiscais
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  
  -- Dados bancários
  banco_principal TEXT,
  agencia TEXT,
  conta TEXT,
  
  -- Informações adicionais
  atividade_principal TEXT,
  capital_social DECIMAL(15,2),
  data_abertura DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Supabase Storage:**

```sql
-- Bucket para logos da empresa
Bucket: 'company-logos'
- Público para visualização
- Políticas de segurança para upload/update
- Organização por user_id
```

### **Políticas de Segurança (RLS):**

```sql
-- Acesso aos próprios dados da empresa
"Users can manage their own company info"

-- Upload de logo próprio
"Users can upload their company logo"

-- Visualização pública de logos
"Company logos are publicly accessible"
```

## 🎨 **Interface e UX**

### **Design Responsivo**
- **Layout em 2 colunas** no desktop
- **Cards organizados** por categoria
- **Adaptação automática** para mobile
- **Espaçamento consistente** entre elementos

### **Validações e Máscaras**
- **CNPJ**: Máscara automática (00.000.000/0000-00)
- **CEP**: Máscara automática (00000-000)
- **Telefone**: Máscara automática ((11) 99999-9999)
- **Estado**: Conversão automática para maiúsculo
- **Email**: Validação de formato

### **Funcionalidades Inteligentes**
- **Busca automática de CEP** via ViaCEP API
- **Preenchimento automático** de endereço
- **Salvamento em tempo real** ao sair dos campos
- **Feedback visual** para todas as ações

## 🔧 **Funcionalidades Técnicas**

### **Integração com APIs Externas**
- **ViaCEP**: Busca automática de endereço por CEP
- **Supabase Storage**: Upload e gestão de logos
- **Supabase Database**: Armazenamento de dados corporativos

### **Salvamento Inteligente**
- **Upsert automático**: Cria ou atualiza conforme necessário
- **Salvamento por campo**: Cada campo salva individualmente
- **Tratamento de erros**: Feedback específico para cada erro
- **Validação de dados**: Verificação antes do salvamento

### **Performance**
- **Índices otimizados** para consultas rápidas
- **Carregamento assíncrono** de dados
- **Cache local** para melhor experiência
- **Debounce** em campos de texto

## 🚀 **Fluxo de Uso**

### **Configurar Dados Básicos:**
1. Fazer upload do logo da empresa
2. Preencher Razão Social (obrigatório)
3. Adicionar Nome Fantasia
4. Inserir CNPJ com máscara automática
5. Definir atividade principal
6. Informar capital social e data de abertura

### **Configurar Endereço:**
1. Digitar CEP → Preenchimento automático
2. Confirmar/ajustar endereço preenchido
3. Adicionar número e complemento
4. Verificar bairro e cidade

### **Configurar Contatos:**
1. Inserir telefone com máscara
2. Adicionar email corporativo
3. Informar website da empresa

### **Configurar Dados Fiscais:**
1. Selecionar regime tributário
2. Informar inscrições estadual e municipal

### **Configurar Dados Bancários:**
1. Informar banco principal
2. Adicionar agência e conta

## 📱 **Compatibilidade**

- **✅ Desktop**: Layout otimizado em 2 colunas
- **✅ Tablet**: Adaptação responsiva automática
- **✅ Mobile**: Interface touch-friendly
- **✅ Navegadores**: Chrome, Firefox, Safari, Edge

## 🔄 **Integrações**

### **APIs Externas**
- **ViaCEP**: Busca de endereço por CEP
- **Supabase**: Banco de dados e storage

### **Validações**
- **CNPJ**: Formato brasileiro padrão
- **CEP**: Formato brasileiro (8 dígitos)
- **Email**: Validação RFC compliant
- **Telefone**: Formato brasileiro com DDD

## 🎯 **Melhorias Futuras Sugeridas**

- [ ] **Validação de CNPJ** (algoritmo de verificação)
- [ ] **Múltiplos telefones** (comercial, celular, fax)
- [ ] **Múltiplos endereços** (matriz, filiais)
- [ ] **Integração com Receita Federal** para validação
- [ ] **Histórico de alterações** dos dados
- [ ] **Backup automático** dos dados corporativos
- [ ] **Exportação de dados** em PDF/Excel
- [ ] **Validação de inscrições** estadual/municipal

## 📊 **Status de Implementação**

### ✅ **Concluído:**
- Dados básicos da empresa funcionais
- Upload de logo operacional
- Endereço com busca automática por CEP
- Contatos da empresa editáveis
- Dados fiscais essenciais
- Dados bancários básicos
- Interface responsiva e moderna
- Integração completa com Supabase
- Máscaras e validações implementadas

### 🔄 **Removido (conforme solicitado):**
- ❌ Configurações Fiscais (seção completa)
- ❌ Localização (formato de moeda, timezone)
- ❌ Backup (configurações de backup)

---

**Status**: ✅ **Totalmente Funcional**
**Versão**: 2.0
**Data**: Janeiro 2025
**Foco**: Dados Corporativos Essenciais
