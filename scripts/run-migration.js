const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co'; // Substitua pela sua URL
const supabaseKey = 'your-service-role-key'; // Substitua pela sua service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250130_create_news_and_tasks_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          
          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error);
            // Continuar com os próximos comandos mesmo se houver erro
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro inesperado no comando ${i + 1}:`, err);
        }
      }
    }
    
    console.log('🎉 Migração concluída!');
    
    // Testar se as tabelas foram criadas
    console.log('🔍 Verificando se as tabelas foram criadas...');
    
    const { data: noticias, error: noticiasError } = await supabase
      .from('noticias_contabeis')
      .select('count(*)')
      .limit(1);
    
    const { data: tarefas, error: tarefasError } = await supabase
      .from('tarefas')
      .select('count(*)')
      .limit(1);
    
    if (!noticiasError) {
      console.log('✅ Tabela noticias_contabeis criada com sucesso');
    } else {
      console.log('❌ Erro ao verificar tabela noticias_contabeis:', noticiasError);
    }
    
    if (!tarefasError) {
      console.log('✅ Tabela tarefas criada com sucesso');
    } else {
      console.log('❌ Erro ao verificar tabela tarefas:', tarefasError);
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração se este arquivo for chamado diretamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
