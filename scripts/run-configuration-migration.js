import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTc3NzE5MSwiZXhwIjoyMDM3MzUzMTkxfQ.QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runConfigurationMigration() {
  try {
    console.log('🚀 Executando migração de configurações...');

    // Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250815_create_configuration_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });

          if (error) {
            console.log(`⚠️ Aviso no comando ${i + 1}: ${error.message}`);
            // Continuar mesmo com avisos (tabelas já existem, etc.)
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.log(`⚠️ Erro no comando ${i + 1}: ${err.message}`);
          // Continuar mesmo com erros menores
        }
      }
    }

    console.log('🎉 Migração concluída!');

    // Testar se as tabelas foram criadas
    console.log('🔍 Verificando se as tabelas foram criadas...');

    const tables = ['categories', 'cost_centers', 'company_info', 'audit_logs', 'app_settings', 'user_preferences'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });

        if (!error) {
          console.log(`✅ Tabela ${table} criada com sucesso`);
        } else {
          console.log(`❌ Erro ao verificar tabela ${table}:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar a migração
runConfigurationMigration();