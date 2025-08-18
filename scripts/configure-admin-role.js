import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function configureAdminRole() {
  console.log('👤 Configurando Permissões de Administrador...\n');

  // ==========================================
  // 1. VERIFICAR USUÁRIOS EXISTENTES
  // ==========================================
  console.log('📋 1. Verificando usuários existentes...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role, user_type, active')
      .order('created_at');

    if (error) {
      console.log('❌ Erro ao carregar profiles:', error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado na tabela profiles');
      console.log('📝 Primeiro, faça login no sistema para criar seu perfil');
      return;
    }

    console.log(`✅ ${profiles.length} usuário(s) encontrado(s):`);
    profiles.forEach((profile, index) => {
      const adminStatus = (profile.user_type === 'admin' || profile.role === 'admin') ? '👑 ADMIN' : '👤 Usuário';
      const activeStatus = profile.active ? '🟢 Ativo' : '🔴 Inativo';
      
      console.log(`   ${index + 1}. ${profile.full_name || profile.email}`);
      console.log(`      Email: ${profile.email}`);
      console.log(`      Role: ${profile.role || 'null'}`);
      console.log(`      User Type: ${profile.user_type || 'null'}`);
      console.log(`      Status: ${adminStatus} | ${activeStatus}`);
      console.log(`      User ID: ${profile.user_id}`);
      console.log('');
    });

    // ==========================================
    // 2. VERIFICAR ADMINISTRADORES
    // ==========================================
    console.log('👑 2. Verificando administradores...');
    
    const admins = profiles.filter(p => p.user_type === 'admin' || p.role === 'admin');
    
    if (admins.length > 0) {
      console.log(`✅ ${admins.length} administrador(es) encontrado(s):`);
      admins.forEach(admin => {
        console.log(`   - ${admin.full_name || admin.email} (${admin.email})`);
      });
    } else {
      console.log('⚠️ NENHUM ADMINISTRADOR ENCONTRADO!');
      console.log('📝 Você precisa tornar pelo menos um usuário administrador');
    }

    // ==========================================
    // 3. INSTRUÇÕES PARA TORNAR USUÁRIO ADMIN
    // ==========================================
    console.log('\n🔧 3. Como tornar um usuário administrador:');
    console.log('\n📋 OPÇÃO 1 - Via SQL Editor do Supabase:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/yoeeobnzifhhkrwrhctv/sql');
    console.log('2. Execute um dos comandos abaixo:\n');

    profiles.forEach((profile, index) => {
      console.log(`-- Para tornar ${profile.full_name || profile.email} administrador:`);
      console.log(`UPDATE public.profiles SET role = 'admin', user_type = 'admin' WHERE user_id = '${profile.user_id}';`);
      console.log('');
    });

    console.log('📋 OPÇÃO 2 - Via Table Editor do Supabase:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/yoeeobnzifhhkrwrhctv/editor');
    console.log('2. Clique na tabela "profiles"');
    console.log('3. Encontre seu usuário e edite a linha');
    console.log('4. Altere os campos:');
    console.log('   - role: "admin"');
    console.log('   - user_type: "admin"');
    console.log('5. Salve as alterações');

    // ==========================================
    // 4. VALORES CORRETOS PARA ADMIN
    // ==========================================
    console.log('\n✅ 4. Valores corretos para ser administrador:');
    console.log('Para que um usuário tenha permissões administrativas, ele precisa ter:');
    console.log('');
    console.log('📝 OPÇÃO A (Recomendada):');
    console.log('   role = "admin"');
    console.log('   user_type = "admin"');
    console.log('');
    console.log('📝 OPÇÃO B (Compatibilidade):');
    console.log('   role = "admin" (user_type pode ser qualquer valor)');
    console.log('');
    console.log('📝 OPÇÃO C (Nova estrutura):');
    console.log('   user_type = "admin" (role pode ser qualquer valor)');

    // ==========================================
    // 5. VERIFICAR LÓGICA DE PERMISSÕES
    // ==========================================
    console.log('\n🔍 5. Como o sistema verifica permissões:');
    console.log('O código verifica se o usuário é admin com esta lógica:');
    console.log('');
    console.log('JavaScript (useAuth.tsx):');
    console.log('const isAdmin = profile?.user_type === "admin" || profile?.role === "admin";');
    console.log('');
    console.log('SQL (função is_admin):');
    console.log('SELECT (user_type = "admin" OR role = "admin") FROM profiles;');
    console.log('');
    console.log('✅ Ou seja: se QUALQUER um dos campos for "admin", o usuário terá permissões administrativas');

    // ==========================================
    // 6. FUNCIONALIDADES DE ADMIN
    // ==========================================
    console.log('\n🎯 6. O que administradores podem fazer:');
    console.log('✅ Criar novos usuários (apenas via Dashboard do Supabase)');
    console.log('✅ Editar perfis de outros usuários');
    console.log('✅ Visualizar todos os dados do sistema');
    console.log('✅ Gerenciar empresas e configurações');
    console.log('✅ Acessar funcionalidades administrativas');
    console.log('');
    console.log('❌ Usuários normais NÃO podem:');
    console.log('❌ Criar outros usuários');
    console.log('❌ Editar perfis de terceiros');
    console.log('❌ Acessar dados de outras empresas');

    // ==========================================
    // 7. PRÓXIMOS PASSOS
    // ==========================================
    console.log('\n🚀 7. Próximos passos:');
    
    if (admins.length === 0) {
      console.log('🔴 URGENTE: Torne pelo menos um usuário administrador');
      console.log('1. Use uma das opções acima para definir role = "admin"');
      console.log('2. Faça logout e login novamente no sistema');
      console.log('3. Verifique se as funcionalidades administrativas aparecem');
    } else {
      console.log('✅ Você já tem administradores configurados');
      console.log('1. Faça login com uma conta de administrador');
      console.log('2. As funcionalidades de gerenciamento devem aparecer');
      console.log('3. Para criar novos usuários, use o Dashboard do Supabase');
    }

    console.log('\n📞 Suporte:');
    console.log('Se ainda não conseguir acessar as funcionalidades administrativas:');
    console.log('1. Verifique se fez logout/login após alterar as permissões');
    console.log('2. Confirme que role = "admin" ou user_type = "admin"');
    console.log('3. Verifique se active = true');
    console.log('4. Abra o console do navegador (F12) para ver possíveis erros');

  } catch (error) {
    console.error('❌ Erro ao configurar permissões:', error.message);
  }
}

// Executar configuração
configureAdminRole().catch(console.error);
