-- ========================================
-- SCRIPTS DE GERENCIAMENTO DE USUÁRIOS
-- Sistema de Controle de Acesso Restrito
-- ========================================

-- ==========================================
-- 1. CONSULTAS DE VERIFICAÇÃO
-- ==========================================

-- Listar todos os usuários com informações completas
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.user_type,
  p.active,
  p.last_sign_in_at,
  c.razao_social as empresa,
  creator.full_name as criado_por,
  p.created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.profiles creator ON p.created_by = creator.user_id
ORDER BY p.created_at DESC;

-- Verificar usuários inativos
SELECT 
  full_name, 
  email, 
  last_sign_in_at,
  created_at
FROM public.profiles 
WHERE active = false
ORDER BY last_sign_in_at DESC;

-- Contar usuários por tipo
SELECT 
  user_type,
  COUNT(*) as total,
  COUNT(CASE WHEN active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN active = false THEN 1 END) as inativos
FROM public.profiles 
GROUP BY user_type
ORDER BY user_type;

-- Verificar usuários sem empresa
SELECT full_name, email, user_type
FROM public.profiles 
WHERE company_id IS NULL;

-- ==========================================
-- 2. GERENCIAMENTO DE EMPRESAS
-- ==========================================

-- Listar todas as empresas
SELECT 
  id,
  razao_social,
  nome_fantasia,
  cnpj_cpf,
  created_at,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id = c.id) as total_usuarios
FROM public.companies c
ORDER BY razao_social;

-- Criar nova empresa (substitua os valores)
INSERT INTO public.companies (
  cnpj_cpf, 
  razao_social, 
  nome_fantasia, 
  created_by, 
  created_at, 
  updated_at
) VALUES (
  '12.345.678/0001-90',           -- CNPJ da empresa
  'Empresa Exemplo Ltda',         -- Razão social
  'Empresa Exemplo',              -- Nome fantasia
  '1e88dc16-5907-4a07-bdf7-005c70fe8941', -- UUID do admin criador
  now(),
  now()
) RETURNING id, razao_social;

-- ==========================================
-- 3. CRIAÇÃO DE USUÁRIOS
-- ==========================================

-- IMPORTANTE: Primeiro crie o usuário no Dashboard do Supabase
-- Authentication → Users → Add User
-- Depois execute o script abaixo com o UUID do usuário criado

-- Criar profile para usuário (substitua os valores)
SELECT public.create_profile_for_user(
  'UUID_DO_USUARIO_AQUI'::UUID,           -- UUID do usuário criado no Dashboard
  'usuario@empresa.com',                   -- Email do usuário
  'Nome Completo do Usuário',             -- Nome completo
  'user'::user_type_new,                  -- Tipo: 'admin', 'user', ou 'viewer'
  'UUID_DA_EMPRESA_AQUI'::UUID            -- UUID da empresa
);

-- Exemplo prático (substitua pelos valores reais):
/*
SELECT public.create_profile_for_user(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
  'joao@minhaempresa.com',
  'João Silva Santos',
  'user'::user_type_new,
  'b885ff1c-8bf2-4b77-b773-59a83b6cfe38'::UUID
);
*/

-- ==========================================
-- 4. GERENCIAMENTO DE PERMISSÕES
-- ==========================================

-- Tornar usuário administrador
UPDATE public.profiles 
SET user_type = 'admin', updated_at = now()
WHERE email = 'usuario@empresa.com';

-- Tornar usuário visualizador apenas
UPDATE public.profiles 
SET user_type = 'viewer', updated_at = now()
WHERE email = 'usuario@empresa.com';

-- Ativar usuário
UPDATE public.profiles 
SET active = true, updated_at = now()
WHERE email = 'usuario@empresa.com';

-- Desativar usuário
UPDATE public.profiles 
SET active = false, updated_at = now()
WHERE email = 'usuario@empresa.com';

-- Transferir usuário para outra empresa
UPDATE public.profiles 
SET company_id = 'UUID_DA_NOVA_EMPRESA'::UUID, updated_at = now()
WHERE email = 'usuario@empresa.com';

-- ==========================================
-- 5. SCRIPTS DE MANUTENÇÃO
-- ==========================================

-- Backup da tabela profiles
CREATE TABLE profiles_backup AS 
SELECT * FROM public.profiles;

-- Verificar integridade dos dados
SELECT 
  'Usuários sem empresa' as problema,
  COUNT(*) as total
FROM public.profiles 
WHERE company_id IS NULL

UNION ALL

SELECT 
  'Usuários com email duplicado' as problema,
  COUNT(*) - COUNT(DISTINCT email) as total
FROM public.profiles

UNION ALL

SELECT 
  'Empresas sem usuários' as problema,
  COUNT(*) as total
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.company_id = c.id
);

-- Limpar usuários inativos há mais de 6 meses
-- CUIDADO: Execute apenas se necessário
/*
DELETE FROM public.profiles 
WHERE active = false 
  AND last_sign_in_at < (now() - interval '6 months')
  AND user_type != 'admin';
*/

-- ==========================================
-- 6. RELATÓRIOS
-- ==========================================

-- Relatório de atividade dos usuários
SELECT 
  p.full_name,
  p.email,
  p.user_type,
  c.razao_social as empresa,
  p.last_sign_in_at,
  CASE 
    WHEN p.last_sign_in_at IS NULL THEN 'Nunca logou'
    WHEN p.last_sign_in_at > (now() - interval '7 days') THEN 'Ativo (7 dias)'
    WHEN p.last_sign_in_at > (now() - interval '30 days') THEN 'Ativo (30 dias)'
    ELSE 'Inativo (>30 dias)'
  END as status_atividade
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.active = true
ORDER BY p.last_sign_in_at DESC NULLS LAST;

-- Relatório de usuários por empresa
SELECT 
  c.razao_social,
  c.cnpj_cpf,
  COUNT(p.id) as total_usuarios,
  COUNT(CASE WHEN p.user_type = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN p.user_type = 'user' THEN 1 END) as usuarios,
  COUNT(CASE WHEN p.user_type = 'viewer' THEN 1 END) as visualizadores,
  COUNT(CASE WHEN p.active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN p.active = false THEN 1 END) as inativos
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
GROUP BY c.id, c.razao_social, c.cnpj_cpf
ORDER BY total_usuarios DESC;

-- ==========================================
-- 7. SCRIPTS DE EMERGÊNCIA
-- ==========================================

-- Criar admin de emergência (após criar usuário via Dashboard)
-- Use apenas em caso de perda de acesso administrativo
/*
UPDATE public.profiles 
SET user_type = 'admin', active = true, updated_at = now()
WHERE user_id = 'UUID_DO_USUARIO_CRIADO'::UUID;
*/

-- Reativar todos os admins (emergência)
/*
UPDATE public.profiles 
SET active = true, updated_at = now()
WHERE user_type = 'admin';
*/

-- Verificar se existem admins ativos
SELECT COUNT(*) as admins_ativos
FROM public.profiles 
WHERE user_type = 'admin' AND active = true;

-- ==========================================
-- NOTAS IMPORTANTES:
-- ==========================================
-- 1. Sempre faça backup antes de executar scripts de modificação
-- 2. Teste em ambiente de desenvolvimento primeiro
-- 3. Substitua os UUIDs pelos valores reais do seu sistema
-- 4. Mantenha pelo menos um admin ativo sempre
-- 5. Use o Dashboard do Supabase para criar usuários no auth.users
-- 6. Execute apenas os scripts necessários para sua situação
