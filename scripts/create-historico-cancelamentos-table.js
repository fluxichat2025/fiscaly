import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createHistoricoCancelamentosTable() {
  console.log('📋 Criando tabela historico_cancelamentos...\n');

  try {
    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabase
      .from('historico_cancelamentos')
      .select('*')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tabela historico_cancelamentos já existe');
      console.log('📊 Registros encontrados:', existingTable?.length || 0);
      return;
    }

    console.log('🔧 Tabela não existe, criando...');

    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.historico_cancelamentos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        referencia VARCHAR(50) NOT NULL,
        numero_nfse VARCHAR(50),
        empresa_id UUID,
        motivo VARCHAR(255) NOT NULL,
        observacao TEXT,
        data_cancelamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        usuario_id UUID,
        status VARCHAR(50) DEFAULT 'cancelado',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar índices para performance
      CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_referencia 
        ON public.historico_cancelamentos(referencia);
      
      CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_empresa_id 
        ON public.historico_cancelamentos(empresa_id);
      
      CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_data 
        ON public.historico_cancelamentos(data_cancelamento DESC);

      -- Habilitar RLS
      ALTER TABLE public.historico_cancelamentos ENABLE ROW LEVEL SECURITY;

      -- Política para permitir acesso aos dados
      CREATE POLICY "Permitir acesso a historico_cancelamentos" 
        ON public.historico_cancelamentos 
        FOR ALL 
        USING (true);

      -- Comentários na tabela
      COMMENT ON TABLE public.historico_cancelamentos IS 'Histórico de cancelamentos de NFSe';
      COMMENT ON COLUMN public.historico_cancelamentos.referencia IS 'Referência da NFSe cancelada';
      COMMENT ON COLUMN public.historico_cancelamentos.numero_nfse IS 'Número da NFSe cancelada';
      COMMENT ON COLUMN public.historico_cancelamentos.empresa_id IS 'ID da empresa que cancelou';
      COMMENT ON COLUMN public.historico_cancelamentos.motivo IS 'Motivo do cancelamento';
      COMMENT ON COLUMN public.historico_cancelamentos.observacao IS 'Observação adicional do cancelamento';
      COMMENT ON COLUMN public.historico_cancelamentos.data_cancelamento IS 'Data e hora do cancelamento';
      COMMENT ON COLUMN public.historico_cancelamentos.usuario_id IS 'ID do usuário que fez o cancelamento';
    `;

    console.log('📝 Executando SQL para criar tabela...');
    console.log('⚠️ IMPORTANTE: Execute este SQL no Dashboard do Supabase:');
    console.log('🔗 https://supabase.com/dashboard/project/yoeeobnzifhhkrwrhctv/sql');
    console.log('');
    console.log('--- SQL PARA EXECUTAR ---');
    console.log(createTableSQL);
    console.log('--- FIM DO SQL ---');
    console.log('');

    // Tentar criar via RPC (pode não funcionar devido a permissões)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (error) {
        console.log('⚠️ Não foi possível criar via RPC (esperado)');
        console.log('📋 Execute o SQL manualmente no Dashboard do Supabase');
      } else {
        console.log('✅ Tabela criada com sucesso via RPC');
      }
    } catch (rpcError) {
      console.log('⚠️ RPC não disponível, use o SQL manual');
    }

    // Verificar novamente após criação manual
    console.log('🔍 Para verificar se a tabela foi criada, execute:');
    console.log('node scripts/test-historico-cancelamentos.js');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
  }
}

// Executar criação
createHistoricoCancelamentosTable().catch(console.error);
