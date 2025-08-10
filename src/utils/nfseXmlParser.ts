// Utilitário para fazer parse do XML da NFSe e extrair dados estruturados
// Interface baseada na estrutura exata do XML da NFSe
export interface NFSeXmlData {
  // InfNfse
  inf_nfse_id: string;
  numero: string;
  codigo_verificacao: string;
  data_emissao: string;

  // ValoresNfse
  base_calculo: number;
  valor_iss: number;
  valor_liquido_nfse: number;

  // PrestadorServico > IdentificacaoPrestador
  prestador_cnpj: string;
  prestador_inscricao_municipal: string;

  // PrestadorServico
  prestador_razao_social: string;

  // PrestadorServico > Endereco
  prestador_endereco: string;
  prestador_numero: string;
  prestador_bairro: string;
  prestador_codigo_municipio: string;
  prestador_uf: string;
  prestador_cep: string;

  // PrestadorServico > Contato
  prestador_telefone: string;
  prestador_email: string;

  // OrgaoGerador
  orgao_codigo_municipio: string;
  orgao_uf: string;

  // Rps > IdentificacaoRps
  rps_numero: string;
  rps_serie: string;
  rps_tipo: string;

  // Rps
  rps_status: string;

  // InfDeclaracaoPrestacaoServico
  competencia: string;

  // Servico > Valores
  servico_valor_servicos: number;
  servico_valor_deducoes: number;
  servico_valor_pis: number;
  servico_valor_cofins: number;
  servico_valor_inss: number;
  servico_valor_ir: number;
  servico_valor_csll: number;
  servico_outras_retencoes: number;
  servico_valor_iss: number;
  servico_aliquota: number;
  servico_desconto_incondicionado: number;
  servico_desconto_condicionado: number;

  // Servico
  servico_iss_retido: number; // 1=Sim, 2=Não
  servico_item_lista_servico: string;
  servico_codigo_cnae: string;
  servico_discriminacao: string;
  servico_codigo_municipio: string;
  servico_exigibilidade_iss: string;

  // Tomador > IdentificacaoTomador
  tomador_cnpj: string;

  // Tomador
  tomador_razao_social: string;

  // Tomador > Endereco
  tomador_endereco: string;
  tomador_numero: string;
  tomador_bairro: string;
  tomador_codigo_municipio: string;
  tomador_uf: string;
  tomador_codigo_pais: string;
  tomador_cep: string;

  // Tomador > Contato
  tomador_email: string;

  // InfDeclaracaoPrestacaoServico
  optante_simples_nacional: number; // 1=Sim, 2=Não
  incentivo_fiscal: number; // 1=Sim, 2=Não

  // ListaMensagemRetorno
  lista_mensagem_retorno: string;
}

export function parseNFSeXML(xmlString: string): NFSeXmlData | null {
  try {
    console.log('🔍 Fazendo parse do XML da NFSe...');
    
    // Função auxiliar para extrair texto de um elemento XML
    const getTextContent = (xml: string, tagName: string): string => {
      const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : '';
    };
    
    // Função auxiliar para extrair número
    const getNumberContent = (xml: string, tagName: string): number => {
      const text = getTextContent(xml, tagName);
      return text ? parseFloat(text) : 0;
    };
    
    // Função auxiliar para extrair número inteiro (para campos como IssRetido, OptanteSimplesNacional)
    const getIntegerContent = (xml: string, tagName: string): number => {
      const text = getTextContent(xml, tagName);
      return text ? parseInt(text) : 0;
    };

    // Extrair InfNfse Id
    const infNfseMatch = xmlString.match(/<InfNfse Id="([^"]*)">/);
    const inf_nfse_id = infNfseMatch ? infNfseMatch[1] : '';

    // Extrair dados básicos da NFSe
    const numero = getTextContent(xmlString, 'Numero');
    const codigo_verificacao = getTextContent(xmlString, 'CodigoVerificacao');
    const data_emissao = getTextContent(xmlString, 'DataEmissao');
    
    // Extrair valores da NFSe
    const base_calculo = getNumberContent(xmlString, 'BaseCalculo');
    const valor_iss = getNumberContent(xmlString, 'ValorIss');
    const valor_liquido_nfse = getNumberContent(xmlString, 'ValorLiquidoNfse');

    // Extrair dados do prestador
    const prestadorMatch = xmlString.match(/<PrestadorServico>(.*?)<\/PrestadorServico>/s);
    const prestadorXml = prestadorMatch ? prestadorMatch[1] : '';

    const prestador_cnpj = getTextContent(prestadorXml, 'Cnpj');
    const prestador_inscricao_municipal = getTextContent(prestadorXml, 'InscricaoMunicipal');
    const prestador_razao_social = getTextContent(prestadorXml, 'RazaoSocial');

    // Extrair endereço do prestador (dentro de PrestadorServico > Endereco)
    const prestadorEnderecoMatch = prestadorXml.match(/<Endereco>(.*?)<\/Endereco>/s);
    const prestadorEnderecoXml = prestadorEnderecoMatch ? prestadorEnderecoMatch[1] : '';

    const prestador_endereco = getTextContent(prestadorEnderecoXml, 'Endereco');
    const prestador_numero = getTextContent(prestadorEnderecoXml, 'Numero');
    const prestador_bairro = getTextContent(prestadorEnderecoXml, 'Bairro');
    const prestador_codigo_municipio = getTextContent(prestadorEnderecoXml, 'CodigoMunicipio');
    const prestador_uf = getTextContent(prestadorEnderecoXml, 'Uf');
    const prestador_cep = getTextContent(prestadorEnderecoXml, 'Cep');

    // Extrair contato do prestador (dentro de PrestadorServico > Contato)
    const prestadorContatoMatch = prestadorXml.match(/<Contato>(.*?)<\/Contato>/s);
    const prestadorContatoXml = prestadorContatoMatch ? prestadorContatoMatch[1] : '';

    const prestador_telefone = getTextContent(prestadorContatoXml, 'Telefone');
    const prestador_email = getTextContent(prestadorContatoXml, 'Email');
    
    // Extrair órgão gerador
    const orgaoMatch = xmlString.match(/<OrgaoGerador>(.*?)<\/OrgaoGerador>/s);
    const orgaoXml = orgaoMatch ? orgaoMatch[1] : '';

    const orgao_codigo_municipio = getTextContent(orgaoXml, 'CodigoMunicipio');
    const orgao_uf = getTextContent(orgaoXml, 'Uf');

    // Extrair dados do RPS (dentro de IdentificacaoRps)
    const rpsMatch = xmlString.match(/<IdentificacaoRps>(.*?)<\/IdentificacaoRps>/s);
    const rpsXml = rpsMatch ? rpsMatch[1] : '';

    const rps_numero = getTextContent(rpsXml, 'Numero');
    const rps_serie = getTextContent(rpsXml, 'Serie');
    const rps_tipo = getTextContent(rpsXml, 'Tipo');

    // Extrair status do RPS (fora de IdentificacaoRps)
    const rpsStatusMatch = xmlString.match(/<Rps>(.*?)<\/Rps>/s);
    const rpsStatusXml = rpsStatusMatch ? rpsStatusMatch[1] : '';
    const rps_status = getTextContent(rpsStatusXml, 'Status');

    // Extrair competência
    const competencia = getTextContent(xmlString, 'Competencia');
    
    // Extrair dados do serviço (dentro de Servico)
    const servicoMatch = xmlString.match(/<Servico>(.*?)<\/Servico>/s);
    const servicoXml = servicoMatch ? servicoMatch[1] : '';

    // Extrair valores do serviço (dentro de Servico > Valores)
    const servicoValoresMatch = servicoXml.match(/<Valores>(.*?)<\/Valores>/s);
    const servicoValoresXml = servicoValoresMatch ? servicoValoresMatch[1] : '';

    const servico_valor_servicos = getNumberContent(servicoValoresXml, 'ValorServicos');
    const servico_valor_deducoes = getNumberContent(servicoValoresXml, 'ValorDeducoes');
    const servico_valor_pis = getNumberContent(servicoValoresXml, 'ValorPis');
    const servico_valor_cofins = getNumberContent(servicoValoresXml, 'ValorCofins');
    const servico_valor_inss = getNumberContent(servicoValoresXml, 'ValorInss');
    const servico_valor_ir = getNumberContent(servicoValoresXml, 'ValorIr');
    const servico_valor_csll = getNumberContent(servicoValoresXml, 'ValorCsll');
    const servico_outras_retencoes = getNumberContent(servicoValoresXml, 'OutrasRetencoes');
    const servico_valor_iss = getNumberContent(servicoValoresXml, 'ValorIss');
    const servico_aliquota = getNumberContent(servicoValoresXml, 'Aliquota');
    const servico_desconto_incondicionado = getNumberContent(servicoValoresXml, 'DescontoIncondicionado');
    const servico_desconto_condicionado = getNumberContent(servicoValoresXml, 'DescontoCondicionado');

    // Extrair outros dados do serviço (fora de Valores)
    const servico_iss_retido = getIntegerContent(servicoXml, 'IssRetido');
    const servico_item_lista_servico = getTextContent(servicoXml, 'ItemListaServico');
    const servico_codigo_cnae = getTextContent(servicoXml, 'CodigoCnae');
    const servico_discriminacao = getTextContent(servicoXml, 'Discriminacao');
    const servico_codigo_municipio = getTextContent(servicoXml, 'CodigoMunicipio');
    const servico_exigibilidade_iss = getTextContent(servicoXml, 'ExigibilidadeISS');
    
    // Extrair dados do tomador
    const tomadorMatch = xmlString.match(/<Tomador>(.*?)<\/Tomador>/s);
    const tomadorXml = tomadorMatch ? tomadorMatch[1] : '';

    const tomador_cnpj = getTextContent(tomadorXml, 'Cnpj');
    const tomador_razao_social = getTextContent(tomadorXml, 'RazaoSocial');

    // Extrair endereço do tomador (dentro de Tomador > Endereco)
    const tomadorEnderecoMatch = tomadorXml.match(/<Endereco>(.*?)<\/Endereco>/s);
    const tomadorEnderecoXml = tomadorEnderecoMatch ? tomadorEnderecoMatch[1] : '';

    const tomador_endereco = getTextContent(tomadorEnderecoXml, 'Endereco');
    const tomador_numero = getTextContent(tomadorEnderecoXml, 'Numero');
    const tomador_bairro = getTextContent(tomadorEnderecoXml, 'Bairro');
    const tomador_codigo_municipio = getTextContent(tomadorEnderecoXml, 'CodigoMunicipio');
    const tomador_uf = getTextContent(tomadorEnderecoXml, 'Uf');
    const tomador_codigo_pais = getTextContent(tomadorEnderecoXml, 'CodigoPais');
    const tomador_cep = getTextContent(tomadorEnderecoXml, 'Cep');

    // Extrair contato do tomador (dentro de Tomador > Contato)
    const tomadorContatoMatch = tomadorXml.match(/<Contato>(.*?)<\/Contato>/s);
    const tomadorContatoXml = tomadorContatoMatch ? tomadorContatoMatch[1] : '';

    const tomador_email = getTextContent(tomadorContatoXml, 'Email');
    
    // Extrair dados fiscais
    const optante_simples_nacional = getIntegerContent(xmlString, 'OptanteSimplesNacional');
    const incentivo_fiscal = getIntegerContent(xmlString, 'IncentivoFiscal');

    // Extrair lista de mensagem de retorno
    const listaMensagemMatch = xmlString.match(/<ListaMensagemRetorno>(.*?)<\/ListaMensagemRetorno>/s);
    const lista_mensagem_retorno = listaMensagemMatch ? listaMensagemMatch[1].trim() : '';
    
    const parsedData: NFSeXmlData = {
      // InfNfse
      inf_nfse_id,
      numero,
      codigo_verificacao,
      data_emissao,

      // ValoresNfse
      base_calculo,
      valor_iss,
      valor_liquido_nfse,

      // PrestadorServico
      prestador_cnpj,
      prestador_inscricao_municipal,
      prestador_razao_social,
      prestador_endereco,
      prestador_numero,
      prestador_bairro,
      prestador_codigo_municipio,
      prestador_uf,
      prestador_cep,
      prestador_telefone,
      prestador_email,

      // OrgaoGerador
      orgao_codigo_municipio,
      orgao_uf,

      // RPS
      rps_numero,
      rps_serie,
      rps_tipo,
      rps_status,

      // InfDeclaracaoPrestacaoServico
      competencia,

      // Servico > Valores
      servico_valor_servicos,
      servico_valor_deducoes,
      servico_valor_pis,
      servico_valor_cofins,
      servico_valor_inss,
      servico_valor_ir,
      servico_valor_csll,
      servico_outras_retencoes,
      servico_valor_iss,
      servico_aliquota,
      servico_desconto_incondicionado,
      servico_desconto_condicionado,

      // Servico
      servico_iss_retido,
      servico_item_lista_servico,
      servico_codigo_cnae,
      servico_discriminacao,
      servico_codigo_municipio,
      servico_exigibilidade_iss,

      // Tomador
      tomador_cnpj,
      tomador_razao_social,
      tomador_endereco,
      tomador_numero,
      tomador_bairro,
      tomador_codigo_municipio,
      tomador_uf,
      tomador_codigo_pais,
      tomador_cep,
      tomador_email,

      // Fiscais
      optante_simples_nacional,
      incentivo_fiscal,

      // ListaMensagemRetorno
      lista_mensagem_retorno
    };
    
    console.log('✅ Parse do XML concluído:', parsedData);
    return parsedData;
    
  } catch (error) {
    console.error('❌ Erro ao fazer parse do XML:', error);
    return null;
  }
}
