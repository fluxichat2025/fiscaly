import { supabase } from '@/integrations/supabase/client';

export async function checkTarefasTable() {
  try {
    console.log('🔍 Verificando se a tabela "tarefas" existe...');
    
    // Tentar fazer uma query simples na tabela
    const { data, error } = await supabase
      .from('tarefas')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao acessar tabela tarefas:', error);
      
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 A tabela "tarefas" não existe. Criando...');
        await createTarefasTable();
      } else {
        console.error('❌ Erro desconhecido:', error);
      }
      return false;
    }

    console.log('✅ Tabela "tarefas" existe e está acessível');
    console.log('📊 Total de registros:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return false;
  }
}

async function createTarefasTable() {
  try {
    console.log('🔨 Tentando criar tabela "tarefas"...');
    
    // Como não podemos criar tabelas via client, vamos mostrar o SQL necessário
    const createTableSQL = `
-- SQL para criar a tabela tarefas no Supabase
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_criacao ON tarefas(data_criacao);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias tarefas
CREATE POLICY "Users can view own tarefas" ON tarefas
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para usuários criarem tarefas
CREATE POLICY "Users can insert own tarefas" ON tarefas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para usuários atualizarem suas próprias tarefas
CREATE POLICY "Users can update own tarefas" ON tarefas
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para usuários deletarem suas próprias tarefas
CREATE POLICY "Users can delete own tarefas" ON tarefas
  FOR DELETE USING (auth.uid() = usuario_id);
    `;

    console.log('📋 SQL necessário para criar a tabela:');
    console.log(createTableSQL);
    
    console.log('⚠️  Execute este SQL no painel do Supabase (SQL Editor) para criar a tabela.');
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao tentar criar tabela:', error);
    return false;
  }
}

// Função para inserir tarefas de exemplo
export async function insertExampleTarefas(userId: string) {
  try {
    console.log('📝 Inserindo tarefas de exemplo...');
    
    const exampleTarefas = [
      {
        titulo: 'Revisar NFSe do cliente ABC',
        descricao: 'Verificar se todas as NFSe foram emitidas corretamente',
        status: 'pendente',
        prioridade: 'alta',
        data_vencimento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        usuario_id: userId
      },
      {
        titulo: 'Preparar relatório mensal',
        descricao: 'Compilar dados fiscais do mês anterior',
        status: 'em_andamento',
        prioridade: 'media',
        data_vencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        usuario_id: userId
      },
      {
        titulo: 'Atualizar cadastro de empresas',
        descricao: 'Verificar dados cadastrais desatualizados',
        status: 'concluida',
        prioridade: 'baixa',
        data_conclusao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        usuario_id: userId
      }
    ];

    const { data, error } = await supabase
      .from('tarefas')
      .insert(exampleTarefas)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir tarefas de exemplo:', error);
      return false;
    }

    console.log('✅ Tarefas de exemplo inseridas:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao inserir tarefas de exemplo:', error);
    return false;
  }
}
