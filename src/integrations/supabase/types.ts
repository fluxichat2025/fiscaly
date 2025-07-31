export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          aliquota: number | null
          atividade_principal: string | null
          bairro: string | null
          cartao_cnpj_url: string | null
          cartao_inscricao_municipal_url: string | null
          cep: string | null
          certificado_digital_base64: string | null
          cidade: string | null
          cnae: string | null
          cnpj_cpf: string
          codigo_municipio: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string
          created_by: string
          data_abertura: string | null
          descricao: string | null
          estado_uf: string | null
          focus_nfe_empresa_id: number | null
          focus_nfe_habilitado: boolean | null
          focus_nfe_token_homologacao: string | null
          focus_nfe_token_producao: string | null
          id: string
          incentivador_cultural: boolean | null
          inscricao_municipal: string | null
          iss_retido: boolean | null
          logradouro: string | null
          natureza_operacao: string | null
          nome_fantasia: string | null
          numero: string | null
          optante_simples_nacional: boolean | null
          razao_social: string
          regime_especial_tributacao: string | null
          senha_certificado: string | null
          servicos: string[] | null
          situacao_cadastral: string | null
          socios: string[] | null
          tipo_logradouro: string | null
          tributacao_nacional: string | null
          updated_at: string
          xml_nfse_url: string | null
        }
        Insert: {
          aliquota?: number | null
          atividade_principal?: string | null
          bairro?: string | null
          cartao_cnpj_url?: string | null
          cartao_inscricao_municipal_url?: string | null
          cep?: string | null
          certificado_digital_base64?: string | null
          cidade?: string | null
          cnae?: string | null
          cnpj_cpf: string
          codigo_municipio?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          created_by: string
          data_abertura?: string | null
          descricao?: string | null
          estado_uf?: string | null
          focus_nfe_empresa_id?: number | null
          focus_nfe_habilitado?: boolean | null
          focus_nfe_token_homologacao?: string | null
          focus_nfe_token_producao?: string | null
          id?: string
          incentivador_cultural?: boolean | null
          inscricao_municipal?: string | null
          iss_retido?: boolean | null
          logradouro?: string | null
          natureza_operacao?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          optante_simples_nacional?: boolean | null
          razao_social: string
          regime_especial_tributacao?: string | null
          senha_certificado?: string | null
          servicos?: string[] | null
          situacao_cadastral?: string | null
          socios?: string[] | null
          tipo_logradouro?: string | null
          tributacao_nacional?: string | null
          updated_at?: string
          xml_nfse_url?: string | null
        }
        Update: {
          aliquota?: number | null
          atividade_principal?: string | null
          bairro?: string | null
          cartao_cnpj_url?: string | null
          cartao_inscricao_municipal_url?: string | null
          cep?: string | null
          certificado_digital_base64?: string | null
          cidade?: string | null
          cnae?: string | null
          cnpj_cpf?: string
          codigo_municipio?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          created_by?: string
          data_abertura?: string | null
          descricao?: string | null
          estado_uf?: string | null
          focus_nfe_empresa_id?: number | null
          focus_nfe_habilitado?: boolean | null
          focus_nfe_token_homologacao?: string | null
          focus_nfe_token_producao?: string | null
          id?: string
          incentivador_cultural?: boolean | null
          inscricao_municipal?: string | null
          iss_retido?: boolean | null
          logradouro?: string | null
          natureza_operacao?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          optante_simples_nacional?: boolean | null
          razao_social?: string
          regime_especial_tributacao?: string | null
          senha_certificado?: string | null
          servicos?: string[] | null
          situacao_cadastral?: string | null
          socios?: string[] | null
          tipo_logradouro?: string | null
          tributacao_nacional?: string | null
          updated_at?: string
          xml_nfse_url?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ambiente: string | null
          ativo: boolean | null
          bairro: string
          cep: string
          cidade: string
          cnpj: string
          complemento: string | null
          created_at: string
          email: string
          endereco: string
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          numero: string
          razao_social: string
          telefone: string | null
          token_focus_nfe: string
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: string | null
          ativo?: boolean | null
          bairro: string
          cep: string
          cidade: string
          cnpj: string
          complemento?: string | null
          created_at?: string
          email: string
          endereco: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          numero: string
          razao_social: string
          telefone?: string | null
          token_focus_nfe: string
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: string | null
          ativo?: boolean | null
          bairro?: string
          cep?: string
          cidade?: string
          cnpj?: string
          complemento?: string | null
          created_at?: string
          email?: string
          endereco?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          numero?: string
          razao_social?: string
          telefone?: string | null
          token_focus_nfe?: string
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "Imóveis Plus": {
        Row: {
          area_privativa: string | null
          area_total: string | null
          caracteristicas: string | null
          categoria: string | null
          codigo: string | null
          descricao: string | null
          descricao_formatada: string | null
          email_prop: string | null
          end_bairro: string | null
          end_cep: string | null
          end_cidade: string | null
          end_complemento: string | null
          end_condominio: string | null
          end_estado: string | null
          end_logradouro: string | null
          end_numero: string | null
          finalidade: string | null
          fotos: string | null
          imagem_01: string | null
          imagem_02: string | null
          imagem_03: string | null
          imagem_04: string | null
          imagem_05: string | null
          imagem_06: string | null
          imagem_07: string | null
          latitude: string | null
          longitude: string | null
          mobiliado: string | null
          nome_corretor: string | null
          nome_prop: string | null
          numero_prop: string | null
          prop_id: string | null
          qtd_banheiro: string | null
          qtd_banheiro_quartos_vagas: string | null
          qtd_quartos: string | null
          qtd_sutes: string | null
          qtd_vagas: string | null
          ref_id: number | null
          tel_corretor: string | null
          tipo_imovel: string | null
          titulo: string | null
          url_site: string | null
          valor_aluguel: string | null
          valor_condominio: string | null
          valor_iptu: string | null
          valor_venda: string | null
        }
        Insert: {
          area_privativa?: string | null
          area_total?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          descricao_formatada?: string | null
          email_prop?: string | null
          end_bairro?: string | null
          end_cep?: string | null
          end_cidade?: string | null
          end_complemento?: string | null
          end_condominio?: string | null
          end_estado?: string | null
          end_logradouro?: string | null
          end_numero?: string | null
          finalidade?: string | null
          fotos?: string | null
          imagem_01?: string | null
          imagem_02?: string | null
          imagem_03?: string | null
          imagem_04?: string | null
          imagem_05?: string | null
          imagem_06?: string | null
          imagem_07?: string | null
          latitude?: string | null
          longitude?: string | null
          mobiliado?: string | null
          nome_corretor?: string | null
          nome_prop?: string | null
          numero_prop?: string | null
          prop_id?: string | null
          qtd_banheiro?: string | null
          qtd_banheiro_quartos_vagas?: string | null
          qtd_quartos?: string | null
          qtd_sutes?: string | null
          qtd_vagas?: string | null
          ref_id?: number | null
          tel_corretor?: string | null
          tipo_imovel?: string | null
          titulo?: string | null
          url_site?: string | null
          valor_aluguel?: string | null
          valor_condominio?: string | null
          valor_iptu?: string | null
          valor_venda?: string | null
        }
        Update: {
          area_privativa?: string | null
          area_total?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          descricao_formatada?: string | null
          email_prop?: string | null
          end_bairro?: string | null
          end_cep?: string | null
          end_cidade?: string | null
          end_complemento?: string | null
          end_condominio?: string | null
          end_estado?: string | null
          end_logradouro?: string | null
          end_numero?: string | null
          finalidade?: string | null
          fotos?: string | null
          imagem_01?: string | null
          imagem_02?: string | null
          imagem_03?: string | null
          imagem_04?: string | null
          imagem_05?: string | null
          imagem_06?: string | null
          imagem_07?: string | null
          latitude?: string | null
          longitude?: string | null
          mobiliado?: string | null
          nome_corretor?: string | null
          nome_prop?: string | null
          numero_prop?: string | null
          prop_id?: string | null
          qtd_banheiro?: string | null
          qtd_banheiro_quartos_vagas?: string | null
          qtd_quartos?: string | null
          qtd_sutes?: string | null
          qtd_vagas?: string | null
          ref_id?: number | null
          tel_corretor?: string | null
          tipo_imovel?: string | null
          titulo?: string | null
          url_site?: string | null
          valor_aluguel?: string | null
          valor_condominio?: string | null
          valor_iptu?: string | null
          valor_venda?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          data_emissao: string
          descricao_servicos: string
          id: string
          n8n_response: Json | null
          numero_nota: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          valor_total: number
          webhook_sent: boolean | null
          webhook_sent_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          data_emissao?: string
          descricao_servicos: string
          id?: string
          n8n_response?: Json | null
          numero_nota: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          valor_total: number
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          data_emissao?: string
          descricao_servicos?: string
          id?: string
          n8n_response?: Json | null
          numero_nota?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          valor_total?: number
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_api: {
        Row: {
          created_at: string
          duration_ms: number | null
          empresa_id: string | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_data: Json | null
          response_data: Json | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          empresa_id?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          empresa_id?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_api_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          aliquota_iss: number
          codigo_servico: string
          codigo_verificacao: string | null
          created_at: string
          data_emissao: string
          discriminacao: string
          empresa_id: string
          focus_nfe_ref: string | null
          id: string
          link_nfse: string | null
          numero: string | null
          prestador_cnpj: string
          prestador_razao_social: string
          status: string | null
          tomador_cnpj: string | null
          tomador_cpf: string | null
          tomador_email: string | null
          tomador_razao_social: string
          updated_at: string
          user_id: string
          valor_cofins: number | null
          valor_csll: number | null
          valor_deducoes: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_iss: number | null
          valor_liquido: number
          valor_pis: number | null
          valor_servicos: number
          webhook_data: Json | null
          xml_nfse: string | null
        }
        Insert: {
          aliquota_iss: number
          codigo_servico: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao: string
          discriminacao: string
          empresa_id: string
          focus_nfe_ref?: string | null
          id?: string
          link_nfse?: string | null
          numero?: string | null
          prestador_cnpj: string
          prestador_razao_social: string
          status?: string | null
          tomador_cnpj?: string | null
          tomador_cpf?: string | null
          tomador_email?: string | null
          tomador_razao_social: string
          updated_at?: string
          user_id: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_liquido: number
          valor_pis?: number | null
          valor_servicos: number
          webhook_data?: Json | null
          xml_nfse?: string | null
        }
        Update: {
          aliquota_iss?: number
          codigo_servico?: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao?: string
          discriminacao?: string
          empresa_id?: string
          focus_nfe_ref?: string | null
          id?: string
          link_nfse?: string | null
          numero?: string | null
          prestador_cnpj?: string
          prestador_razao_social?: string
          status?: string | null
          tomador_cnpj?: string | null
          tomador_cpf?: string | null
          tomador_email?: string | null
          tomador_razao_social?: string
          updated_at?: string
          user_id?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_liquido?: number
          valor_pis?: number | null
          valor_servicos?: number
          webhook_data?: Json | null
          xml_nfse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      company_type: "ME" | "EPP" | "MEI" | "LTDA" | "SA" | "EIRELI"
      invoice_status: "rascunho" | "emitida" | "cancelada" | "erro"
      tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real" | "mei"
      user_role: "admin" | "colaborador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      company_type: ["ME", "EPP", "MEI", "LTDA", "SA", "EIRELI"],
      invoice_status: ["rascunho", "emitida", "cancelada", "erro"],
      tax_regime: ["simples_nacional", "lucro_presumido", "lucro_real", "mei"],
      user_role: ["admin", "colaborador"],
    },
  },
} as const
