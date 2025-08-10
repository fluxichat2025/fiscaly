import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Upload, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFocusNFeAPI, FocusNFeEmpresa, EmpresaListItem } from '@/hooks/useFocusNFeAPI';
import { supabase } from '@/integrations/supabase/client';
import { CompanyNfseConfigManager } from '@/components/CompanyNfseConfigManager';

interface EmpresaFormFocusProps {
  empresa?: EmpresaListItem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmpresaFormFocus({ empresa, onSuccess, onCancel }: EmpresaFormFocusProps) {
  const [activeTab, setActiveTab] = useState('identificacao');
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateStatus, setCertificateStatus] = useState<'ausente' | 'presente' | 'validado'>('ausente');
  const [supabaseCompanyId, setSupabaseCompanyId] = useState<string | null>(null);
  const { toast } = useToast();
  const { createEmpresa, updateEmpresa, getEmpresa, loading } = useFocusNFeAPI();

  // Estados para configurações de NFSe (salvos no Supabase)
  const [nfseConfig, setNfseConfig] = useState({
    item_lista_servico: '',
    codigo_tributario_municipio: '',
    aliquota: 0,
    iss_retido: false,
    natureza_operacao: '',
    optante_simples_nacional: false,
    incentivador_cultural: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<Partial<FocusNFeEmpresa>>({
    defaultValues: {
      regime_tributario: '3',
      habilita_nfe: false,
      habilita_nfce: false,
      habilita_nfse: false,
      habilita_nfsen_producao: false,
      habilita_nfsen_homologacao: false,
      habilita_cte: false,
      habilita_mdfe: false,
      habilita_manifestacao: false,
      habilita_manifestacao_cte: false,
      enviar_email_destinatario: true,
      enviar_email_homologacao: true,
      discrimina_impostos: false,
      mostrar_danfse_badge: true,
    }
  });

  // Carregar dados da empresa quando estiver editando
  useEffect(() => {
    const loadEmpresaData = async () => {
      if (empresa?.id) {
        try {
          const empresaCompleta = await getEmpresa(empresa.id);

          // Resetar o formulário com os dados da empresa
          reset({
            cnpj: empresaCompleta.cnpj,
            nome: empresaCompleta.nome,
            nome_fantasia: empresaCompleta.nome_fantasia,
            inscricao_estadual: empresaCompleta.inscricao_estadual,
            inscricao_municipal: empresaCompleta.inscricao_municipal,
            regime_tributario: empresaCompleta.regime_tributario,
            email: empresaCompleta.email,
            telefone: empresaCompleta.telefone,
            cep: empresaCompleta.cep,
            logradouro: empresaCompleta.logradouro,
            numero: empresaCompleta.numero,
            complemento: empresaCompleta.complemento,
            bairro: empresaCompleta.bairro,
            municipio: empresaCompleta.municipio,
            uf: empresaCompleta.uf,
            nome_responsavel: empresaCompleta.nome_responsavel,
            cpf_responsavel: empresaCompleta.cpf_responsavel,
            cpf_cnpj_contabilidade: empresaCompleta.cpf_cnpj_contabilidade,
            token_producao: empresaCompleta.token_producao,
            token_homologacao: empresaCompleta.token_homologacao,
            habilita_nfe: empresaCompleta.habilita_nfe,
            habilita_nfce: empresaCompleta.habilita_nfce,
            habilita_nfse: empresaCompleta.habilita_nfse,
            habilita_nfsen_producao: empresaCompleta.habilita_nfsen_producao,
            habilita_nfsen_homologacao: empresaCompleta.habilita_nfsen_homologacao,
            habilita_cte: empresaCompleta.habilita_cte,
            habilita_mdfe: empresaCompleta.habilita_mdfe,
            habilita_manifestacao: empresaCompleta.habilita_manifestacao,
            habilita_manifestacao_cte: empresaCompleta.habilita_manifestacao_cte,
            enviar_email_destinatario: empresaCompleta.enviar_email_destinatario,
            enviar_email_homologacao: empresaCompleta.enviar_email_homologacao,
            discrimina_impostos: empresaCompleta.discrimina_impostos,
            mostrar_danfse_badge: empresaCompleta.mostrar_danfse_badge,
          });

          // Atualizar status do certificado se existir
          if (empresaCompleta.certificado_valido_ate) {
            setCertificateStatus('presente');
          }

          // Carregar configurações de NFSe do Supabase
          await loadNfseConfig(empresaCompleta.cnpj);
        } catch (error) {
          console.error('Erro ao carregar dados da empresa:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar os dados da empresa",
          });
        }
      }
    };

    loadEmpresaData();
  }, [empresa?.id]); // Removido getEmpresa, reset, toast das dependências

  // Função para carregar configurações de NFSe do Supabase
  const loadNfseConfig = async (cnpj?: string) => {
    const cnpjToUse = cnpj || empresa?.cnpj_cpf;
    if (!cnpjToUse) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, item_lista_servico, codigo_tributario_municipio, aliquota, iss_retido, natureza_operacao, optante_simples_nacional, incentivador_cultural')
        .eq('cnpj_cpf', cnpjToUse)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao carregar configurações de NFSe:', error);
        return;
      }

      if (data) {
        setSupabaseCompanyId(data.id);
        setNfseConfig({
          item_lista_servico: data.item_lista_servico || '',
          codigo_tributario_municipio: data.codigo_tributario_municipio || '',
          aliquota: data.aliquota || 0,
          iss_retido: data.iss_retido || false,
          natureza_operacao: data.natureza_operacao || '',
          optante_simples_nacional: data.optante_simples_nacional || false,
          incentivador_cultural: data.incentivador_cultural || false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de NFSe:', error);
    }
  };

  const watchedValues = watch();

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

      setValue('arquivo_certificado_base64', base64);
      setValue('senha_certificado', certificatePassword);
      setCertificateStatus('validado');
      setCertificateDialogOpen(false);
      
      toast({
        title: "Certificado validado",
        description: "Certificado digital foi validado com sucesso!",
      });
    } catch (error) {
      console.error('Erro na validação:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao validar certificado",
      });
    }
  };

  // Submit do formulário
  const onSubmit = async (formData: Partial<FocusNFeEmpresa>) => {
    try {
      if (empresa?.id) {
        // Atualizar empresa existente
        await updateEmpresa(empresa.id, formData);
      } else {
        // Criar nova empresa
        await createEmpresa(formData);
      }

      // Salvar configurações de NFSe no Supabase
      await saveNfseConfig(formData.cnpj || empresa?.cnpj_cpf);

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      // O erro já é tratado no hook useFocusNFeAPI
    }
  };

  // Função para salvar configurações de NFSe no Supabase
  const saveNfseConfig = async (cnpj?: string) => {
    if (!cnpj) return;

    try {
      // Primeiro, verificar se a empresa já existe no Supabase
      const { data: existingCompany, error: selectError } = await supabase
        .from('companies')
        .select('id, cnpj_cpf')
        .eq('cnpj_cpf', cnpj)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Erro ao verificar empresa existente:', selectError);
        return;
      }

      if (existingCompany) {
        // Empresa existe, fazer UPDATE apenas dos campos de NFSe
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            item_lista_servico: nfseConfig.item_lista_servico,
            codigo_tributario_municipio: nfseConfig.codigo_tributario_municipio,
            aliquota: nfseConfig.aliquota,
            iss_retido: nfseConfig.iss_retido,
            natureza_operacao: nfseConfig.natureza_operacao,
            optante_simples_nacional: nfseConfig.optante_simples_nacional,
            incentivador_cultural: nfseConfig.incentivador_cultural,
            updated_at: new Date().toISOString(),
          })
          .eq('cnpj_cpf', cnpj);

        if (updateError) {
          console.error('Erro ao atualizar configurações de NFSe:', updateError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao salvar configurações de NFSe",
          });
        } else {
          // Set the company ID for the NFSe config manager
          setSupabaseCompanyId(existingCompany.id);
          console.log('✅ Configurações de NFSe salvas com sucesso');
          toast({
            title: "Sucesso",
            description: "Configurações de NFSe salvas com sucesso",
          });
        }
      } else {
        // Empresa não existe, criar registro básico primeiro
        const empresaData = getValues();
        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert({
            cnpj_cpf: cnpj,
            razao_social: empresaData.nome || 'Empresa sem nome',
            nome_fantasia: empresaData.nome_fantasia || '',
            item_lista_servico: nfseConfig.item_lista_servico,
            codigo_tributario_municipio: nfseConfig.codigo_tributario_municipio,
            aliquota: nfseConfig.aliquota,
            iss_retido: nfseConfig.iss_retido,
            natureza_operacao: nfseConfig.natureza_operacao,
            optante_simples_nacional: nfseConfig.optante_simples_nacional,
            incentivador_cultural: nfseConfig.incentivador_cultural,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Erro ao criar empresa com configurações de NFSe:', insertError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao salvar configurações de NFSe",
          });
        } else {
          // Set the company ID for the NFSe config manager
          if (newCompany) {
            setSupabaseCompanyId(newCompany.id);
          }
          console.log('✅ Empresa criada com configurações de NFSe');
          toast({
            title: "Sucesso",
            description: "Configurações de NFSe salvas com sucesso",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de NFSe:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao salvar configurações",
      });
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
          <Badge variant="default" className="gap-1 bg-green-600 text-white">
            <CheckCircle className="h-3 w-3" />
            Validado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-xl font-semibold">Nova empresa</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header com CNPJ e Razão Social */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              {...register('cnpj', { required: 'CNPJ é obrigatório' })}
              placeholder="00.000.000/0000-00"
            />
            {errors.cnpj && (
              <p className="text-sm text-destructive">{errors.cnpj.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Razão Social</Label>
            <Input
              id="nome"
              {...register('nome', { required: 'Razão Social é obrigatória' })}
              placeholder="Nome da empresa"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="pessoa_fisica"
                checked={watchedValues.pessoa_fisica}
                onCheckedChange={(checked) => setValue('pessoa_fisica', checked)}
              />
              <Label htmlFor="pessoa_fisica">Pessoa Física</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="certificado_exclusivo"
                checked={watchedValues.certificado_exclusivo}
                onCheckedChange={(checked) => setValue('certificado_exclusivo', checked)}
              />
              <Label htmlFor="certificado_exclusivo">Certificado Exclusivo</Label>
            </div>
          </div>
        </div>

        {/* Status do Certificado */}
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
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  ANEXAR CERTIFICADO
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="identificacao">IDENTIFICAÇÃO</TabsTrigger>
            <TabsTrigger value="contato">CONTATO</TabsTrigger>
            <TabsTrigger value="endereco">ENDEREÇO</TabsTrigger>
            <TabsTrigger value="responsavel">RESPONSÁVEL</TabsTrigger>
            <TabsTrigger value="contabilidade">CONTABILIDADE</TabsTrigger>
            <TabsTrigger value="tokens">TOKENS</TabsTrigger>
            <TabsTrigger value="documentos">DOCUMENTOS FISCAIS</TabsTrigger>
            <TabsTrigger value="nfse">NFSe</TabsTrigger>
            <TabsTrigger value="configuracoes">CONFIGURAÇÕES</TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" className="space-y-4">
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                ANEXAR LOGO DA EMPRESA
              </Button>
            </div>

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
                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                <Input
                  id="inscricao_estadual"
                  {...register('inscricao_estadual')}
                  placeholder="123456789"
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
                <Label htmlFor="regime_tributario">Regime Tributário</Label>
                <Select
                  value={watchedValues.regime_tributario}
                  onValueChange={(value) => setValue('regime_tributario', value as '1' | '2' | '3')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Simples Nacional</SelectItem>
                    <SelectItem value="2">Simples Nacional - Excesso</SelectItem>
                    <SelectItem value="3">Regime Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contato" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
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
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  {...register('complemento')}
                  placeholder="Apto 101"
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
                <Label htmlFor="municipio">Município</Label>
                <Select
                  value={watchedValues.municipio}
                  onValueChange={(value) => setValue('municipio', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o município" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sao-paulo">São Paulo</SelectItem>
                    <SelectItem value="rio-janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="belo-horizonte">Belo Horizonte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Select
                  value={watchedValues.uf}
                  onValueChange={(value) => setValue('uf', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="responsavel" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_responsavel">Nome responsável</Label>
                <Input
                  id="nome_responsavel"
                  {...register('nome_responsavel')}
                  placeholder="Nome completo do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_responsavel">CPF responsável</Label>
                <Input
                  id="cpf_responsavel"
                  {...register('cpf_responsavel')}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contabilidade" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj_contabilidade">CPF / CNPJ</Label>
              <Input
                id="cpf_cnpj_contabilidade"
                {...register('cpf_cnpj_contabilidade')}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
              />
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Token de Homologação</Label>
                <Input
                  value={watchedValues.token_homologacao || ''}
                  placeholder="Token será gerado automaticamente"
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Token de Produção</Label>
                <Input
                  value={watchedValues.token_producao || ''}
                  placeholder="Token será gerado automaticamente"
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_nfe"
                    checked={watchedValues.habilita_nfe}
                    onCheckedChange={(checked) => setValue('habilita_nfe', checked)}
                  />
                  <Label htmlFor="habilita_nfe">NFe</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_nfce"
                    checked={watchedValues.habilita_nfce}
                    onCheckedChange={(checked) => setValue('habilita_nfce', checked)}
                  />
                  <Label htmlFor="habilita_nfce">NFCe</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_nfse"
                    checked={watchedValues.habilita_nfse}
                    onCheckedChange={(checked) => setValue('habilita_nfse', checked)}
                  />
                  <Label htmlFor="habilita_nfse">NFSe</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_nfsen_homologacao"
                    checked={watchedValues.habilita_nfsen_homologacao}
                    onCheckedChange={(checked) => setValue('habilita_nfsen_homologacao', checked)}
                  />
                  <Label htmlFor="habilita_nfsen_homologacao">NFSe Nacional - Homologação</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_nfsen_producao"
                    checked={watchedValues.habilita_nfsen_producao}
                    onCheckedChange={(checked) => setValue('habilita_nfsen_producao', checked)}
                  />
                  <Label htmlFor="habilita_nfsen_producao">NFSe Nacional - Produção</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_cte"
                    checked={watchedValues.habilita_cte}
                    onCheckedChange={(checked) => setValue('habilita_cte', checked)}
                  />
                  <Label htmlFor="habilita_cte">CTe</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_mdfe"
                    checked={watchedValues.habilita_mdfe}
                    onCheckedChange={(checked) => setValue('habilita_mdfe', checked)}
                  />
                  <Label htmlFor="habilita_mdfe">MDFe</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_manifestacao"
                    checked={watchedValues.habilita_manifestacao}
                    onCheckedChange={(checked) => setValue('habilita_manifestacao', checked)}
                  />
                  <Label htmlFor="habilita_manifestacao">Recebimento de NFes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="habilita_manifestacao_cte"
                    checked={watchedValues.habilita_manifestacao_cte}
                    onCheckedChange={(checked) => setValue('habilita_manifestacao_cte', checked)}
                  />
                  <Label htmlFor="habilita_manifestacao_cte">Recebimento de CTes</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nfse" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Configurações de NFSe</h3>
                <p className="text-sm text-muted-foreground">
                  Configure múltiplos códigos tributários e itens de serviço para esta empresa. Estes dados estarão disponíveis para seleção rápida durante a emissão de NFSe.
                </p>
              </div>

              {supabaseCompanyId ? (
                <CompanyNfseConfigManager companyId={supabaseCompanyId} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Salve a empresa primeiro para configurar os dados de NFSe</p>
                </div>
              )}

              {/* Legacy single-entry configuration for backward compatibility */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Configurações Legadas (Compatibilidade)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Estas configurações são mantidas para compatibilidade com o sistema atual.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nfse_item_lista_servico">Item da Lista de Serviços</Label>
                      <Input
                        id="nfse_item_lista_servico"
                        value={nfseConfig.item_lista_servico}
                        onChange={(e) => setNfseConfig(prev => ({ ...prev, item_lista_servico: e.target.value }))}
                        placeholder="Ex: 140600"
                        maxLength={6}
                      />
                      <p className="text-sm text-muted-foreground">
                        Código de 6 dígitos conforme tabela da Focus NFe
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nfse_codigo_tributario_municipio">Código Tributário do Município</Label>
                      <Input
                        id="nfse_codigo_tributario_municipio"
                        value={nfseConfig.codigo_tributario_municipio}
                        onChange={(e) => setNfseConfig(prev => ({ ...prev, codigo_tributario_municipio: e.target.value }))}
                        placeholder="Ex: 332100001"
                      />
                      <p className="text-sm text-muted-foreground">
                        Código CNAE municipal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nfse_aliquota">Alíquota ISS (%)</Label>
                      <Input
                        id="nfse_aliquota"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={nfseConfig.aliquota}
                        onChange={(e) => setNfseConfig(prev => ({ ...prev, aliquota: parseFloat(e.target.value) || 0 }))}
                        placeholder="Ex: 5.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nfse_natureza_operacao">Natureza da Operação</Label>
                      <select
                        id="nfse_natureza_operacao"
                        value={nfseConfig.natureza_operacao}
                        onChange={(e) => setNfseConfig(prev => ({ ...prev, natureza_operacao: e.target.value }))}
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
                        id="nfse_iss_retido"
                        checked={nfseConfig.iss_retido}
                        onCheckedChange={(checked) => setNfseConfig(prev => ({ ...prev, iss_retido: checked }))}
                      />
                      <Label htmlFor="nfse_iss_retido">ISS Retido na Fonte</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="nfse_optante_simples_nacional"
                        checked={nfseConfig.optante_simples_nacional}
                        onCheckedChange={(checked) => setNfseConfig(prev => ({ ...prev, optante_simples_nacional: checked }))}
                      />
                      <Label htmlFor="nfse_optante_simples_nacional">Optante Simples Nacional</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="nfse_incentivador_cultural"
                        checked={nfseConfig.incentivador_cultural}
                        onCheckedChange={(checked) => setNfseConfig(prev => ({ ...prev, incentivador_cultural: checked }))}
                      />
                      <Label htmlFor="nfse_incentivador_cultural">Incentivador Cultural</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações avançadas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enviar_email_destinatario"
                    checked={watchedValues.enviar_email_destinatario}
                    onCheckedChange={(checked) => setValue('enviar_email_destinatario', checked)}
                  />
                  <Label htmlFor="enviar_email_destinatario">(todos os documentos) Enviar email ao destinatário</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enviar_email_homologacao"
                    checked={watchedValues.enviar_email_homologacao}
                    onCheckedChange={(checked) => setValue('enviar_email_homologacao', checked)}
                  />
                  <Label htmlFor="enviar_email_homologacao">(todos os documentos) Enviar email em homologação</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="discrimina_impostos"
                    checked={watchedValues.discrimina_impostos}
                    onCheckedChange={(checked) => setValue('discrimina_impostos', checked)}
                  />
                  <Label htmlFor="discrimina_impostos">(NFe, NFCe) Discrimina impostos</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mostrar_danfse_badge"
                    checked={watchedValues.mostrar_danfse_badge}
                    onCheckedChange={(checked) => setValue('mostrar_danfse_badge', checked)}
                  />
                  <Label htmlFor="mostrar_danfse_badge">Mostrar badge Focus NFe na DANFSe</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            VOLTAR
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {empresa?.id ? 'ATUALIZAR' : 'CRIAR'}
          </Button>
        </div>
      </form>

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
              disabled={!certificatePassword}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Validar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
