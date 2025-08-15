# 🔒 Sistema de Controle de Acesso Restrito

## 📋 **Resumo da Implementação**

O sistema foi transformado em uma aplicação de **acesso restrito** onde apenas administradores podem criar novos usuários. O registro público foi completamente desabilitado.

## 🚫 **Alterações Implementadas**

### **1. Signup Público Desabilitado**
- ✅ `disable_signup: true` no Supabase
- ✅ Aba "Cadastrar" removida da interface
- ✅ Função `signUp()` removida do hook useAuth
- ✅ Formulário de registro removido

### **2. Tabela Profiles Reconfigurada**
```sql
-- NOVA ESTRUTURA DA TABELA PROFILES
- id (UUID, PK)
- user_id (UUID, FK auth.users, UNIQUE, NOT NULL)
- full_name (TEXT, NOT NULL) -- Substituiu first_name
- email (TEXT, NOT NULL)
- phone (TEXT, opcional)
- role (TEXT) -- Mantido para compatibilidade
- user_type (ENUM: 'admin', 'user', 'viewer', NOT NULL)
- company_id (UUID, FK companies, NOT NULL)
- active (BOOLEAN, DEFAULT true, NOT NULL)
- created_by (UUID, FK auth.users)
- created_at, updated_at (TIMESTAMP)
```

### **3. Políticas RLS Restritivas**
- ✅ Apenas admins podem criar/excluir usuários
- ✅ Usuários só veem/editam próprio perfil
- ✅ Admins veem/editam todos os perfis
- ✅ Validação de usuário ativo no login

### **4. Triggers e Funções**
- ❌ Trigger automático de criação removido
- ✅ Trigger de auditoria de login criado
- ✅ Função para criar profiles manualmente

## 👥 **Tipos de Usuário**

### **🔴 Admin**
- Pode criar, editar e excluir usuários
- Acesso total ao sistema
- Pode gerenciar empresas e configurações

### **🟡 User**
- Usuário padrão com acesso completo às funcionalidades
- Pode gerenciar dados da própria empresa
- Não pode criar outros usuários

### **🟢 Viewer**
- Acesso apenas de visualização
- Não pode editar dados críticos
- Ideal para consultores externos

## 🔧 **Como Criar Novos Usuários**

### **Método 1: Dashboard do Supabase (Recomendado)**

1. **Acesse o Dashboard:**
   - URL: https://supabase.com/dashboard/project/yoeeobnzifhhkrwrhctv
   - Vá para: Authentication → Users

2. **Criar Usuário:**
   - Clique em "Add User"
   - Preencha email e senha
   - Marque "Auto Confirm User" ✅
   - Clique em "Create User"

3. **Criar Profile:**
   - Copie o UUID do usuário criado
   - Vá para: Table Editor → profiles
   - Clique em "Insert" → "Insert row"
   - Preencha os campos:

```sql
user_id: [UUID_DO_USUARIO]
full_name: "Nome Completo"
email: "email@empresa.com"
user_type: "user" (ou "admin"/"viewer")
company_id: [UUID_DA_EMPRESA]
active: true
created_by: [UUID_DO_ADMIN_CRIADOR]
```

### **Método 2: SQL Script**

Execute no SQL Editor do Supabase:

```sql
-- 1. Primeiro, criar o usuário via Dashboard (método 1)
-- 2. Depois, executar este SQL com o UUID do usuário:

SELECT public.create_profile_for_user(
  '[UUID_DO_USUARIO]'::UUID,
  'email@empresa.com',
  'Nome Completo',
  'user'::user_type_new,
  '[UUID_DA_EMPRESA]'::UUID
);
```

## 🏢 **Gerenciar Empresas**

### **Listar Empresas Existentes:**
```sql
SELECT id, razao_social, nome_fantasia, cnpj_cpf 
FROM public.companies 
ORDER BY razao_social;
```

### **Criar Nova Empresa:**
```sql
INSERT INTO public.companies (
  cnpj_cpf, 
  razao_social, 
  nome_fantasia, 
  created_by, 
  created_at, 
  updated_at
) VALUES (
  '12.345.678/0001-90',
  'Empresa Exemplo Ltda',
  'Empresa Exemplo',
  '[UUID_DO_ADMIN]'::UUID,
  now(),
  now()
) RETURNING id;
```

## 🔍 **Scripts de Consulta Úteis**

### **Listar Todos os Usuários:**
```sql
SELECT 
  p.full_name,
  p.email,
  p.user_type,
  p.active,
  c.razao_social as empresa,
  p.created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;
```

### **Verificar Usuários Inativos:**
```sql
SELECT full_name, email, last_sign_in_at
FROM public.profiles 
WHERE active = false;
```

### **Ativar/Desativar Usuário:**
```sql
-- Desativar usuário
UPDATE public.profiles 
SET active = false 
WHERE email = 'usuario@empresa.com';

-- Ativar usuário
UPDATE public.profiles 
SET active = true 
WHERE email = 'usuario@empresa.com';
```

## 🛡️ **Segurança Implementada**

### **Validações Ativas:**
- ✅ Signup público desabilitado
- ✅ Apenas admins criam usuários
- ✅ Usuários inativos são deslogados automaticamente
- ✅ RLS impede acesso não autorizado
- ✅ Auditoria de login implementada

### **Políticas RLS:**
```sql
-- Visualização: próprio perfil + admins veem todos
"Users can view their own profile and admins can view all"

-- Atualização: próprio perfil + admins editam todos  
"Users can update their own profile and admins can update all"

-- Inserção: apenas admins
"Only admins can create profiles"

-- Exclusão: apenas admins
"Only admins can delete profiles"
```

## ⚠️ **Importante**

### **Backup de Segurança:**
Antes de fazer alterações importantes, sempre faça backup:
```sql
-- Backup da tabela profiles
CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;
```

### **Primeiro Admin:**
O primeiro usuário criado automaticamente vira admin. Se não houver admins:
```sql
-- Tornar usuário admin
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE email = 'seu@email.com';
```

### **Recuperação de Acesso:**
Se perder acesso admin, use o SQL Editor:
```sql
-- Criar admin de emergência (após criar usuário via Dashboard)
UPDATE public.profiles 
SET user_type = 'admin', active = true 
WHERE user_id = '[UUID_DO_USUARIO]';
```

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Verifique os logs no Supabase Dashboard
2. Confirme se as políticas RLS estão ativas
3. Teste com usuário admin válido
4. Verifique se o usuário está ativo

**Status**: ✅ **Sistema de Acesso Restrito Implementado com Sucesso**
