import { supabase } from '@/integrations/supabase/client';

export async function checkNoticiasTable() {
  try {
    console.log('🔍 Verificando se a tabela "noticias_contabeis" existe...');
    
    // Tentar fazer uma query simples na tabela
    const { data, error } = await supabase
      .from('noticias_contabeis')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao acessar tabela noticias_contabeis:', error);
      
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 A tabela "noticias_contabeis" não existe. SQL necessário:');
        showCreateTableSQL();
      } else {
        console.error('❌ Erro desconhecido:', error);
      }
      return false;
    }

    console.log('✅ Tabela "noticias_contabeis" existe e está acessível');
    console.log('📊 Total de registros:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return false;
  }
}

function showCreateTableSQL() {
  const createTableSQL = `
-- SQL para criar a tabela noticias_contabeis no Supabase
CREATE TABLE IF NOT EXISTS noticias_contabeis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  link_original VARCHAR(500),
  categoria VARCHAR(100),
  autor VARCHAR(100),
  fonte VARCHAR(100) DEFAULT 'Jornal Contábil',
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_noticias_status ON noticias_contabeis(status);
CREATE INDEX IF NOT EXISTS idx_noticias_data_publicacao ON noticias_contabeis(data_publicacao);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias_contabeis(categoria);

-- Habilitar RLS (Row Level Security) - opcional para notícias públicas
ALTER TABLE noticias_contabeis ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública das notícias ativas
CREATE POLICY "Public can view active noticias" ON noticias_contabeis
  FOR SELECT USING (status = 'ativo');

-- Política para usuários autenticados poderem inserir notícias
CREATE POLICY "Authenticated users can insert noticias" ON noticias_contabeis
  FOR INSERT TO authenticated WITH CHECK (true);

-- Política para usuários autenticados poderem atualizar notícias
CREATE POLICY "Authenticated users can update noticias" ON noticias_contabeis
  FOR UPDATE TO authenticated USING (true);
  `;

  console.log('📋 SQL necessário para criar a tabela:');
  console.log(createTableSQL);
  console.log('⚠️  Execute este SQL no painel do Supabase (SQL Editor) para criar a tabela.');
}

// Função para inserir notícias de exemplo
export async function insertExampleNoticias() {
  try {
    console.log('📝 Inserindo notícias de exemplo...');
    
    const exampleNoticias = [
      {
        titulo: 'Receita Federal paga nesta quinta o 3° lote de restituição do IR 2025',
        resumo: 'O crédito bancário das 7.219.048 restituições terá um valor total de R$ 10 bilhões.',
        data_publicacao: new Date().toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/receita-federal-paga-nesta-quinta-o-3-lote-de-restituicao-do-ir-2025/',
        categoria: 'Imposto de Renda',
        autor: 'Ana Luzia Rodrigues',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'PL libera funcionamento de comércio aos domingos e feriados',
        resumo: 'Projeto de lei visa flexibilizar regras trabalhistas para o setor comercial',
        data_publicacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/pl-libera-funcionamento-de-comercio-aos-domingos-e-feriados/',
        categoria: 'CLT',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'Você sabia que mesmo no Simples Nacional pode haver retenção de ISS?',
        resumo: 'Descubra como funciona a retenção de ISS para empresas do Simples Nacional',
        data_publicacao: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/voce-sabia-que-mesmo-no-simples-nacional-pode-haver-retencao-de-iss-descubra-como-funciona/',
        categoria: 'Contabilidade',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'IOF: Pequenas empresas sentem o peso do aumento no custo do crédito',
        resumo: 'Aumento do IOF impacta diretamente o custo de financiamento para pequenos negócios',
        data_publicacao: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/iof-pequenas-empresas-sentem-o-peso-do-aumento-no-custo-do-credito/',
        categoria: 'Simples Nacional',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'Reforma Tributária: Novas alterações para CT-e, CR-eOS e GTV-e',
        resumo: 'As Regras de Validação serão aplicadas a partir de 05 de janeiro de 2026',
        data_publicacao: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/reforma-tributaria-novas-alteracoes-para-ct-e-cr-eos-e-gtv-e/',
        categoria: 'Reforma Tributária',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'Cinco falhas que impedem empresas de crescerem por falta de inteligência analítica',
        resumo: 'Tomar decisões baseadas apenas em intuição ainda é realidade para muitas empresas brasileiras',
        data_publicacao: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/cinco-falhas-que-impedem-empresas-de-crescerem-por-falta-de-inteligencia-analitica/',
        categoria: 'Fique Sabendo',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      },
      {
        titulo: 'Tentativas de fraudes atingem 2,8% das transações no 1º semestre, revela AcertPix',
        resumo: 'Dados mostram crescimento nas tentativas de fraude em transações digitais',
        data_publicacao: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        link_original: 'https://www.jornalcontabil.com.br/noticia/tentativas-de-fraudes-atingem-28-das-transacoes-no-1o-semestre-revela-acertpix/',
        categoria: 'Fique Sabendo',
        autor: 'Jornal Contábil',
        fonte: 'Jornal Contábil',
        status: 'ativo'
      }
    ];

    const { data, error } = await supabase
      .from('noticias_contabeis')
      .insert(exampleNoticias)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir notícias de exemplo:', error);
      return false;
    }

    console.log('✅ Notícias de exemplo inseridas:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao inserir notícias de exemplo:', error);
    return false;
  }
}
