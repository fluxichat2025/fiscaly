import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCertificateValidation } from '@/hooks/useCertificateValidation';

interface SocioData {
  nome: string;
  telefone: string;
  email: string;
}

interface CompanyFormData {
  // Identificação
  id?: string;
  cnpj_cpf: string;
  razao_social: string;
  nome_fantasia: string;
  company_type: 'ME' | 'EPP' | 'MEI' | 'LTDA' | 'SA' | 'EIRELI';
  situacao_cadastral: string;
  data_abertura: string;
  atividade_principal: string;
  cnae: string;
  inscricao_municipal: string;
  aliquota: number;
  iss_retido: boolean;
  optante_simples_nacional: boolean;
  incentivador_cultural: boolean;

  // Campos de Serviço (dados para emissão automática de NFSe)
  item_lista_servico: string;
  codigo_tributario_municipio: string;

  // Campos de Configuração Fiscal Complementar
  natureza_operacao: string;
  
  // Contato (empresa)
  email_empresa: string;
  telefone_empresa: string;
  
  // Endereço
  cep: string;
  tipo_logradouro: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado_uf: string;
  codigo_municipio: string;
  
  // Responsável
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone_whatsapp: string;
  responsavel_email: string;
  
  // Contabilidade
  contabilidade_cnpj_cpf: string;
  contabilidade_razao_social: string;
  contabilidade_telefone: string;
  contabilidade_email: string;
  tributacao_nacional: string;
  natureza_operacao: string;
  regime_especial_tributacao: string;
  
  // Responsável/Sócios (JSON no banco)
  socios: string[];
  
  // Tokens (readonly)
  focus_nfe_token_homologacao: string;
  focus_nfe_token_producao: string;
  focus_nfe_habilitado: boolean;
  
  // Arquivos
  xml_nfse_url: string;
  cartao_cnpj_url: string;
  cartao_inscricao_municipal_url: string;
  certificado_digital_base64: string;
  senha_certificado: string;
  
  // Documentos Fiscais
  nfe_habilitado: boolean;
  nfce_habilitado: boolean;
  nfse_habilitado: boolean;
  nfse_nacional_homologacao: boolean;
  nfse_nacional_producao: boolean;
  cte_habilitado: boolean;
  mdfe_habilitado: boolean;
  recebimento_nfes: boolean;
  recebimento_ctes: boolean;
  
  // Configurações
  certificado_exclusivo: boolean;
  envio_email_producao: boolean;
  envio_email_homologacao: boolean;
  discriminar_impostos: boolean;
  badge_focus_danfse: boolean;
}

interface CompanyFormProps {
  company?: Partial<CompanyFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [activeTab, setActiveTab] = useState('identificacao');
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateStatus, setCertificateStatus] = useState<'ausente' | 'presente' | 'validado'>('ausente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { validateCertificate, isValidating } = useCertificateValidation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<CompanyFormData>({
    defaultValues: {
      company_type: 'LTDA',
      certificado_exclusivo: false,
      envio_email_producao: true,
      envio_email_homologacao: true,
      discriminar_impostos: false,
      badge_focus_danfse: true,
      iss_retido: false,
      optante_simples_nacional: false,
      incentivador_cultural: false,
      item_lista_servico: '',
      codigo_tributario_municipio: '',
      natureza_operacao: '',
      focus_nfe_habilitado: false,
      nfe_habilitado: false,
      nfce_habilitado: false,
      nfse_habilitado: false,
      nfse_nacional_homologacao: false,
      nfse_nacional_producao: false,
      cte_habilitado: false,
      mdfe_habilitado: false,
      recebimento_nfes: false,
      recebimento_ctes: false,
      socios: [],
      email_empresa: '',
      telefone_empresa: '',
      responsavel_nome: '',
      responsavel_cpf: '',
      responsavel_telefone_whatsapp: '',
      responsavel_email: '',
      contabilidade_cnpj_cpf: '',
      contabilidade_razao_social: '',
      contabilidade_telefone: '',
      contabilidade_email: '',
      ...company
    }
  });

  const watchedValues = watch();

  // Auto-fill com XML NFSe
  const handleXmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Extrair dados do XML e preencher formulário
      const cnpj = xmlDoc.querySelector('CpfCnpj Cnpj')?.textContent;
      const razaoSocial = xmlDoc.querySelector('RazaoSocial')?.textContent;
      const inscricaoMunicipal = xmlDoc.querySelector('InscricaoMunicipal')?.textContent;
      
      if (cnpj) setValue('cnpj_cpf', cnpj);
      if (razaoSocial) setValue('razao_social', razaoSocial);
      if (inscricaoMunicipal) setValue('inscricao_municipal', inscricaoMunicipal);

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('company-documents')
        .upload(`xml-nfse/${Date.now()}_${file.name}`, file);

      if (error) throw error;
      
      setValue('xml_nfse_url', data.path);
      
      toast({
        title: "XML carregado",
        description: "Dados do XML foram preenchidos automaticamente!",
      });
    } catch (error) {
      console.error('Erro ao processar XML:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar arquivo XML",
      });
    }
  };

  // Upload de certificado digital
  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCertificateFile(file);
    setCertificateStatus('presente');
    setCertificateDialogOpen(true);
  };

  // Validar certificado com senha
  const handleCertificateValidation = async () => {
    if (!certificateFile || !certificatePassword) return;

    try {
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:application/... prefix
        };
        reader.readAsDataURL(certificateFile);
      });

      // Validar certificado
      const result = await validateCertificate(base64, certificatePassword);
      
      if (result.isValid) {
        setValue('certificado_digital_base64', base64);
        setValue('senha_certificado', certificatePassword);
        setCertificateStatus('validado');
        setCertificateDialogOpen(false);
        
        // Auto-preencher dados se disponíveis
        if (result.cnpj) setValue('cnpj_cpf', result.cnpj);
        if (result.razaoSocial) setValue('razao_social', result.razaoSocial);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  // Upload de outros documentos
  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'cartao_cnpj' | 'cartao_inscricao_municipal'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .upload(`${type}/${Date.now()}_${file.name}`, file);

      if (error) throw error;
      
      setValue(`${type}_url`, data.path);
      
      toast({
        title: "Documento carregado",
        description: "Documento enviado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao upload:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao enviar documento",
      });
    }
  };

  // Submit do formulário
  const onSubmit = async (formData: CompanyFormData) => {
    setIsSubmitting(true);
    
    try {
      // Preparar dados para o banco (removendo campos que não existem na tabela)
      const {
        certificado_exclusivo,
        envio_email_producao,
        envio_email_homologacao,
        discriminar_impostos,
        badge_focus_danfse,
        email_empresa,
        telefone_empresa,
        responsavel_nome,
        responsavel_cpf,
        responsavel_telefone_whatsapp,
        responsavel_email,
        contabilidade_cnpj_cpf,
        contabilidade_razao_social,
        contabilidade_telefone,
        contabilidade_email,
        nfe_habilitado,
        nfce_habilitado,
        nfse_habilitado,
        nfse_nacional_homologacao,
        nfse_nacional_producao,
        cte_habilitado,
        mdfe_habilitado,
        recebimento_nfes,
        recebimento_ctes,
        ...dbData
      } = formData;

      if (company?.id) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update(dbData)
          .eq('id', company.id);

        if (error) throw error;
        
        toast({
          title: "Empresa atualizada",
          description: "Dados da empresa foram atualizados com sucesso!",
        });
      } else {
        // Criar nova empresa
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('companies')
          .insert({
            ...dbData,
            created_by: user.user.id
          });

        if (error) throw error;

        // Se tem certificado, criar empresa no Focus NFe
        if (formData.certificado_digital_base64 && formData.senha_certificado) {
          try {
            const { data: focusResult } = await supabase.functions.invoke('focus-nfe-api', {
              body: {
                action: 'create_company',
                data: {
                  cnpj: formData.cnpj_cpf,
                  razao_social: formData.razao_social,
                  nome_fantasia: formData.nome_fantasia,
                  certificado_base64: formData.certificado_digital_base64,
                  senha_certificado: formData.senha_certificado
                }
              }
            });

            if (focusResult?.success) {
              toast({
                title: "Integração Focus NFe",
                description: "Empresa cadastrada no Focus NFe. Tokens serão disponibilizados em breve.",
              });
            }
          } catch (focusError) {
            console.error('Erro Focus NFe:', focusError);
            toast({
              variant: "destructive",
              title: "Aviso",
              description: "Empresa criada, mas houve erro na integração Focus NFe.",
            });
          }
        }
        
        toast({
          title: "Empresa criada",
          description: "Nova empresa foi criada com sucesso!",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar empresa",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCertificateStatusBadge = () => {
    switch (certificateStatus) {
      case 'ausente':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Ausente
          </Badge>
        );
      case 'presente':
        return (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            Presente
          </Badge>
        );
      case 'validado':
        return (
          <Badge variant="default" className="gap-1 bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3" />
            Validado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{company?.id ? 'Editar Prestador' : 'Novo Prestador'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header com CNPJ e Razão Social */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cnpj_cpf">CNPJ/CPF *</Label>
                <Input
                  id="cnpj_cpf"
                  {...register('cnpj_cpf', { required: 'CNPJ/CPF é obrigatório' })}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj_cpf && (
                  <p className="text-sm text-destructive">{errors.cnpj_cpf.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social *</Label>
                <Input
                  id="razao_social"
                  {...register('razao_social', { required: 'Razão Social é obrigatória' })}
                  placeholder="Nome da empresa"
                />
                {errors.razao_social && (
                  <p className="text-sm text-destructive">{errors.razao_social.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pessoa_fisica"
                    checked={watchedValues.company_type === 'MEI'}
                    onCheckedChange={(checked) => 
                      setValue('company_type', checked ? 'MEI' : 'LTDA')
                    }
                  />
                  <Label htmlFor="pessoa_fisica">Microempreendedor Individual</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="certificado_exclusivo"
                    {...register('certificado_exclusivo')}
                  />
                  <Label htmlFor="certificado_exclusivo">Certificado Exclusivo</Label>
                </div>
              </div>
            </div>

            {/* Status do Certificado e Upload */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Certificado Digital:</span>
                    {getCertificateStatusBadge()}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      onChange={handleCertificateUpload}
                      className="hidden"
                      id="certificate-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('certificate-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Anexar Certificado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="identificacao">IDENTIFICAÇÃO</TabsTrigger>
                <TabsTrigger value="contato">CONTATO</TabsTrigger>
                <TabsTrigger value="endereco">ENDEREÇO</TabsTrigger>
                <TabsTrigger value="responsavel">RESPONSÁVEL</TabsTrigger>
                <TabsTrigger value="contabilidade">CONTABILIDADE</TabsTrigger>
                <TabsTrigger value="tokens">TOKENS</TabsTrigger>
                <TabsTrigger value="documentos">DOCUMENTOS FISCAIS</TabsTrigger>
                <TabsTrigger value="configuracoes">CONFIGURAÇÕES</TabsTrigger>
              </TabsList>

              <TabsContent value="identificacao" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      {...register('nome_fantasia')}
                      placeholder="Nome fantasia"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="situacao_cadastral">Situação Cadastral</Label>
                    <Input
                      id="situacao_cadastral"
                      {...register('situacao_cadastral')}
                      placeholder="Ativa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_abertura">Data de Abertura</Label>
                    <Input
                      id="data_abertura"
                      type="date"
                      {...register('data_abertura')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cnae">CNAE</Label>
                    <Input
                      id="cnae"
                      {...register('cnae')}
                      placeholder="0000-0/00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      {...register('inscricao_municipal')}
                      placeholder="123456"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aliquota">Alíquota (%)</Label>
                    <Input
                      id="aliquota"
                      type="number"
                      step="0.01"
                      {...register('aliquota', { valueAsNumber: true })}
                      placeholder="5.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="atividade_principal">Atividade Principal</Label>
                  <Input
                    id="atividade_principal"
                    {...register('atividade_principal')}
                    placeholder="Descrição da atividade principal"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="iss_retido"
                      {...register('iss_retido')}
                    />
                    <Label htmlFor="iss_retido">ISS Retido</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="optante_simples_nacional"
                      {...register('optante_simples_nacional')}
                    />
                    <Label htmlFor="optante_simples_nacional">Optante Simples Nacional</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="incentivador_cultural"
                      {...register('incentivador_cultural')}
                    />
                    <Label htmlFor="incentivador_cultural">Incentivador Cultural</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contato" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_empresa">E-mail da Empresa</Label>
                    <Input
                      id="email_empresa"
                      type="email"
                      {...register('email_empresa')}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone_empresa">Telefone da Empresa</Label>
                    <Input
                      id="telefone_empresa"
                      {...register('telefone_empresa')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      placeholder="00000-000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      {...register('logradouro')}
                      placeholder="Nome da rua"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      {...register('numero')}
                      placeholder="123"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      {...register('bairro')}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      {...register('cidade')}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado_uf">UF</Label>
                    <Input
                      id="estado_uf"
                      {...register('estado_uf')}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="responsavel" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_nome">Nome Completo *</Label>
                    <Input
                      id="responsavel_nome"
                      {...register('responsavel_nome', { required: 'Nome do responsável é obrigatório' })}
                      placeholder="Nome completo do responsável"
                    />
                    {errors.responsavel_nome && (
                      <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_cpf">CPF *</Label>
                    <Input
                      id="responsavel_cpf"
                      {...register('responsavel_cpf', { required: 'CPF do responsável é obrigatório' })}
                      placeholder="000.000.000-00"
                    />
                    {errors.responsavel_cpf && (
                      <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_telefone_whatsapp">Telefone WhatsApp *</Label>
                    <Input
                      id="responsavel_telefone_whatsapp"
                      {...register('responsavel_telefone_whatsapp', { required: 'Telefone WhatsApp é obrigatório' })}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.responsavel_telefone_whatsapp && (
                      <p className="text-sm text-destructive">{errors.responsavel_telefone_whatsapp.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_email">E-mail *</Label>
                    <Input
                      id="responsavel_email"
                      type="email"
                      {...register('responsavel_email', { required: 'E-mail do responsável é obrigatório' })}
                      placeholder="responsavel@email.com"
                    />
                    {errors.responsavel_email && (
                      <p className="text-sm text-destructive">{errors.responsavel_email.message}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contabilidade" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contabilidade_cnpj_cpf">CPF/CNPJ da Contabilidade</Label>
                    <Input
                      id="contabilidade_cnpj_cpf"
                      {...register('contabilidade_cnpj_cpf')}
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Insira o CPF/CNPJ para buscar automaticamente as informações da contabilidade
                    </p>
                  </div>
                  
                  {watchedValues.contabilidade_cnpj_cpf && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="contabilidade_razao_social">Razão Social</Label>
                        <Input
                          id="contabilidade_razao_social"
                          {...register('contabilidade_razao_social')}
                          placeholder="Nome da contabilidade"
                          readOnly
                          className="bg-background"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contabilidade_telefone">Telefone</Label>
                        <Input
                          id="contabilidade_telefone"
                          {...register('contabilidade_telefone')}
                          placeholder="(11) 99999-9999"
                          readOnly
                          className="bg-background"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="contabilidade_email">E-mail</Label>
                        <Input
                          id="contabilidade_email"
                          type="email"
                          {...register('contabilidade_email')}
                          placeholder="contato@contabilidade.com"
                          readOnly
                          className="bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tokens" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Integração Focus NFe</h3>
                      <p className="text-sm text-muted-foreground">
                        {watchedValues.focus_nfe_habilitado 
                          ? 'Integração ativa' 
                          : 'Aguardando configuração'}
                      </p>
                    </div>
                    <Switch
                      checked={watchedValues.focus_nfe_habilitado}
                      onCheckedChange={(checked) => setValue('focus_nfe_habilitado', checked)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Token Homologação</Label>
                      <Input
                        value={watchedValues.focus_nfe_token_homologacao || ''}
                        placeholder="Token será gerado automaticamente"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Token Produção</Label>
                      <Input
                        value={watchedValues.focus_nfe_token_producao || ''}
                        placeholder="Token será gerado automaticamente"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="space-y-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tipos de Documentos Fiscais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nfe_habilitado"
                          {...register('nfe_habilitado')}
                        />
                        <Label htmlFor="nfe_habilitado">NFe</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nfce_habilitado"
                          {...register('nfce_habilitado')}
                        />
                        <Label htmlFor="nfce_habilitado">NFCe</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nfse_habilitado"
                          {...register('nfse_habilitado')}
                        />
                        <Label htmlFor="nfse_habilitado">NFSe</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nfse_nacional_homologacao"
                          {...register('nfse_nacional_homologacao')}
                        />
                        <Label htmlFor="nfse_nacional_homologacao">NFSe Nacional - Homologação</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nfse_nacional_producao"
                          {...register('nfse_nacional_producao')}
                        />
                        <Label htmlFor="nfse_nacional_producao">NFSe Nacional - Produção</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="cte_habilitado"
                          {...register('cte_habilitado')}
                        />
                        <Label htmlFor="cte_habilitado">CTe</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="mdfe_habilitado"
                          {...register('mdfe_habilitado')}
                        />
                        <Label htmlFor="mdfe_habilitado">MDFe</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="recebimento_nfes"
                          {...register('recebimento_nfes')}
                        />
                        <Label htmlFor="recebimento_nfes">Recebimento de NFes</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="recebimento_ctes"
                          {...register('recebimento_ctes')}
                        />
                        <Label htmlFor="recebimento_ctes">Recebimento de CTes</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Upload de Documentos</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>XML NFSe (preenchimento automático)</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".xml"
                            onChange={handleXmlUpload}
                            className="hidden"
                            id="xml-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('xml-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Carregar XML
                          </Button>
                          {watchedValues.xml_nfse_url && (
                            <Badge variant="secondary">Carregado</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cartão CNPJ</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentUpload(e, 'cartao_cnpj')}
                            className="hidden"
                            id="cnpj-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('cnpj-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Cartão CNPJ
                          </Button>
                          {watchedValues.cartao_cnpj_url && (
                            <Badge variant="secondary">Carregado</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cartão Inscrição Municipal</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentUpload(e, 'cartao_inscricao_municipal')}
                            className="hidden"
                            id="im-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('im-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Cartão IM
                          </Button>
                          {watchedValues.cartao_inscricao_municipal_url && (
                            <Badge variant="secondary">Carregado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="configuracoes" className="space-y-6">
                {/* Configurações de NFSe */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de NFSe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_lista_servico">Item da Lista de Serviços</Label>
                      <Input
                        id="item_lista_servico"
                        {...register('item_lista_servico')}
                        placeholder="Ex: 140600"
                        maxLength={6}
                      />
                      <p className="text-sm text-muted-foreground">
                        Código de 6 dígitos conforme tabela da Focus NFe
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_tributario_municipio">Código Tributário do Município</Label>
                      <Input
                        id="codigo_tributario_municipio"
                        {...register('codigo_tributario_municipio')}
                        placeholder="Ex: 332100001"
                      />
                      <p className="text-sm text-muted-foreground">
                        Código CNAE municipal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aliquota">Alíquota ISS (%)</Label>
                      <Input
                        id="aliquota"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register('aliquota', { valueAsNumber: true })}
                        placeholder="Ex: 5.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
                      <select
                        id="natureza_operacao"
                        {...register('natureza_operacao')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        <option value="1">Tributação no município</option>
                        <option value="2">Tributação fora do município</option>
                        <option value="3">Isenção</option>
                        <option value="4">Imune</option>
                        <option value="5">Exigibilidade suspensa por decisão judicial</option>
                        <option value="6">Exigibilidade suspensa por procedimento administrativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="iss_retido"
                        {...register('iss_retido')}
                      />
                      <Label htmlFor="iss_retido">ISS Retido na Fonte</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="optante_simples_nacional"
                        {...register('optante_simples_nacional')}
                      />
                      <Label htmlFor="optante_simples_nacional">Optante Simples Nacional</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="incentivador_cultural"
                        {...register('incentivador_cultural')}
                      />
                      <Label htmlFor="incentivador_cultural">Incentivador Cultural</Label>
                    </div>
                  </div>
                </div>

                {/* Configurações Gerais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="envio_email_producao"
                        {...register('envio_email_producao')}
                      />
                      <Label htmlFor="envio_email_producao">Envio Email Produção</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="envio_email_homologacao"
                        {...register('envio_email_homologacao')}
                      />
                      <Label htmlFor="envio_email_homologacao">Envio Email Homologação</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="discriminar_impostos"
                        {...register('discriminar_impostos')}
                      />
                      <Label htmlFor="discriminar_impostos">Discriminar Impostos</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="badge_focus_danfse"
                        {...register('badge_focus_danfse')}
                      />
                      <Label htmlFor="badge_focus_danfse">Badge Focus NFe na DANFSe</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {company?.id ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog para senha do certificado */}
      <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha do Certificado Digital</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cert-password">Digite a senha do certificado</Label>
              <Input
                id="cert-password"
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                placeholder="Senha do certificado"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCertificateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCertificateValidation}
              disabled={!certificatePassword || isValidating}
            >
              {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Validar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}