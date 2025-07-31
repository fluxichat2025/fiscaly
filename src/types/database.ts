// Tipos para as novas tabelas do banco de dados

export interface NoticiaContabil {
  id: string;
  titulo: string;
  resumo?: string;
  conteudo?: string;
  data_publicacao?: string;
  link_original: string;
  imagem_url?: string;
  categoria?: string;
  autor?: string;
  fonte: string;
  status: 'ativo' | 'inativo' | 'arquivado';
  visualizacoes: number;
  created_at: string;
  updated_at: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  data_criacao: string;
  data_vencimento?: string;
  data_conclusao?: string;
  usuario_id: string;
  empresa_id?: string;
  categoria?: string;
  tags?: string[];
  anexos?: any[];
  comentarios?: any[];
  created_at: string;
  updated_at: string;
}

// Tipos para inserção (campos opcionais)
export interface NoticiaContabilInsert {
  titulo: string;
  resumo?: string;
  conteudo?: string;
  data_publicacao?: string;
  link_original: string;
  imagem_url?: string;
  categoria?: string;
  autor?: string;
  fonte?: string;
  status?: 'ativo' | 'inativo' | 'arquivado';
}

export interface TarefaInsert {
  titulo: string;
  descricao?: string;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  data_vencimento?: string;
  usuario_id: string;
  empresa_id?: string;
  categoria?: string;
  tags?: string[];
}

// Tipos para atualização
export interface NoticiaContabilUpdate {
  titulo?: string;
  resumo?: string;
  conteudo?: string;
  data_publicacao?: string;
  imagem_url?: string;
  categoria?: string;
  autor?: string;
  status?: 'ativo' | 'inativo' | 'arquivado';
  visualizacoes?: number;
}

export interface TarefaUpdate {
  titulo?: string;
  descricao?: string;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  data_vencimento?: string;
  data_conclusao?: string;
  categoria?: string;
  tags?: string[];
  anexos?: any[];
  comentarios?: any[];
}

// Tipos para filtros e consultas
export interface NoticiasFiltros {
  categoria?: string;
  status?: 'ativo' | 'inativo' | 'arquivado';
  data_inicio?: string;
  data_fim?: string;
  limite?: number;
  offset?: number;
}

export interface TarefasFiltros {
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  empresa_id?: string;
  limite?: number;
  offset?: number;
}

// Tipos para estatísticas do dashboard
export interface DashboardStats {
  total_nfse: number;
  valor_total_faturado: number;
  empresas_cadastradas: number;
  nfse_mes_atual: number;
  valor_mes_atual: number;
  tarefas_pendentes: number;
  tarefas_vencidas: number;
  noticias_nao_lidas: number;
}

// Tipos para web scraping
export interface NoticiaScrapedData {
  titulo: string;
  resumo?: string;
  conteudo?: string;
  data_publicacao?: string;
  link_original: string;
  imagem_url?: string;
  categoria?: string;
  autor?: string;
}

export interface ScrapingResult {
  success: boolean;
  noticias: NoticiaScrapedData[];
  errors?: string[];
  total_processadas: number;
  total_novas: number;
}
