// Códigos IBGE para UFs
export const UF_CODES: Record<string, string> = {
  'AC': '12', // Acre
  'AL': '17', // Alagoas
  'AP': '16', // Amapá
  'AM': '13', // Amazonas
  'BA': '29', // Bahia
  'CE': '23', // Ceará
  'DF': '53', // Distrito Federal
  'ES': '32', // Espírito Santo
  'GO': '52', // Goiás
  'MA': '21', // Maranhão
  'MT': '51', // Mato Grosso
  'MS': '50', // Mato Grosso do Sul
  'MG': '31', // Minas Gerais
  'PA': '15', // Pará
  'PB': '25', // Paraíba
  'PR': '41', // Paraná
  'PE': '26', // Pernambuco
  'PI': '22', // Piauí
  'RJ': '33', // Rio de Janeiro
  'RN': '24', // Rio Grande do Norte
  'RS': '43', // Rio Grande do Sul
  'RO': '11', // Rondônia
  'RR': '14', // Roraima
  'SC': '42', // Santa Catarina
  'SP': '35', // São Paulo
  'SE': '28', // Sergipe
  'TO': '17'  // Tocantins
}

// Principais códigos de municípios (exemplos)
export const MUNICIPIO_CODES: Record<string, Record<string, string>> = {
  'SP': {
    'São Paulo': '3550308',
    'Campinas': '3509502',
    'Santos': '3548500',
    'São Bernardo do Campo': '3548708',
    'Guarulhos': '3518800',
    'Osasco': '3534401',
    'Ribeirão Preto': '3543402',
    'Sorocaba': '3552205'
  },
  'RJ': {
    'Rio de Janeiro': '3304557',
    'Niterói': '3303302',
    'Nova Iguaçu': '3303500',
    'Duque de Caxias': '3301702',
    'São Gonçalo': '3304904',
    'Volta Redonda': '3306305',
    'Petrópolis': '3303906',
    'Campos dos Goytacazes': '3301009'
  },
  'MG': {
    'Belo Horizonte': '3106200',
    'Uberlândia': '3170206',
    'Contagem': '3118601',
    'Juiz de Fora': '3136702',
    'Betim': '3106705',
    'Montes Claros': '3143302',
    'Ribeirão das Neves': '3154606',
    'Uberaba': '3170107'
  },
  'PR': {
    'Curitiba': '4106902',
    'Londrina': '4113700',
    'Maringá': '4115200',
    'Ponta Grossa': '4119905',
    'Cascavel': '4104808',
    'São José dos Pinhais': '4125506',
    'Foz do Iguaçu': '4108304',
    'Colombo': '4106001'
  },
  'RS': {
    'Porto Alegre': '4314902',
    'Caxias do Sul': '4305108',
    'Pelotas': '4314407',
    'Canoas': '4304606',
    'Santa Maria': '4316907',
    'Gravataí': '4309209',
    'Viamão': '4323002',
    'Novo Hamburgo': '4313409'
  },
  'SC': {
    'Florianópolis': '4205407',
    'Joinville': '4209102',
    'Blumenau': '4202404',
    'São José': '4216602',
    'Criciúma': '4204608',
    'Chapecó': '4204202',
    'Itajaí': '4208203',
    'Lages': '4209300'
  },
  'BA': {
    'Salvador': '2927408',
    'Feira de Santana': '2910800',
    'Vitória da Conquista': '2933307',
    'Camaçari': '2905004',
    'Juazeiro': '2918407',
    'Ilhéus': '2913606',
    'Itabuna': '2916104',
    'Lauro de Freitas': '2919207'
  },
  'GO': {
    'Goiânia': '5208707',
    'Aparecida de Goiânia': '5201108',
    'Anaápolis': '5201405',
    'Rio Verde': '5218805',
    'Luziania': '5212501',
    'Águas Lindas de Goiás': '5200258',
    'Valparaíso de Goiás': '5221403',
    'Trindade': '5221197'
  },
  'PE': {
    'Recife': '2611606',
    'Jaboatão dos Guararapes': '2607901',
    'Olinda': '2609600',
    'Caruaru': '2604106',
    'Petrolina': '2611101',
    'Paulista': '2610707',
    'Cabo de Santo Agostinho': '2602902',
    'Camaragibe': '2603454'
  },
  'CE': {
    'Fortaleza': '2304400',
    'Caucaia': '2303709',
    'Juazeiro do Norte': '2307650',
    'Maracanaú': '2308104',
    'Sobral': '2312908',
    'Crato': '2304285',
    'Itapipoca': '2306256',
    'Maranguape': '2308005'
  },
  'PA': {
    'Belém': '1501402',
    'Ananindeua': '1500800',
    'Santarém': '1506807',
    'Marabá': '1504208',
    'Parauapebas': '1505536',
    'Castanhal': '1502400',
    'Abaetetuba': '1500107',
    'Cametá': '1502103'
  },
  'MA': {
    'São Luís': '2111300',
    'Imperatriz': '2105302',
    'São José de Ribamar': '2111201',
    'Timon': '2112209',
    'Caxias': '2103000',
    'Codó': '2103307',
    'Paço do Lumiar': '2107704',
    'Açailândia': '2100055'
  },
  'PB': {
    'João Pessoa': '2507507',
    'Campina Grande': '2504009',
    'Santa Rita': '2513703',
    'Patos': '2510808',
    'Bayeux': '2501500',
    'Sousa': '2516201',
    'Cajazeiras': '2503209',
    'Cabedelo': '2503001'
  },
  'AL': {
    'Maceió': '2704302',
    'Arapiraca': '2700102',
    'Rio Largo': '2707701',
    'Palmeira dos Índios': '2706422',
    'União dos Palmares': '2709301',
    'Penedo': '2706703',
    'Coruripe': '2702306',
    'Delmiro Gouveia': '2702504'
  },
  'SE': {
    'Aracaju': '2800308',
    'Nossa Senhora do Socorro': '2804607',
    'Lagarto': '2803609',
    'Itabaiana': '2803005',
    'São Cristóvão': '2806701',
    'Estância': '2802700',
    'Tobias Barreto': '2807303',
    'Simão Dias': '2807105'
  },
  'RN': {
    'Natal': '2408102',
    'Mossoró': '2408003',
    'Parnamirim': '2409332',
    'São Gonçalo do Amarante': '2412005',
    'Macaíba': '2407104',
    'Ceará-Mirim': '2402600',
    'Caicó': '2401800',
    'Açu': '2400109'
  },
  'PI': {
    'Teresina': '2211001',
    'Parnaíba': '2207702',
    'Picos': '2208007',
    'Piripiri': '2208106',
    'Floriano': '2203909',
    'Campo Maior': '2202251',
    'Barras': '2201200',
    'União': '2211308'
  },
  'AC': {
    'Rio Branco': '1200401',
    'Cruzeiro do Sul': '1200203',
    'Sena Madureira': '1200500',
    'Tarauacá': '1200609',
    'Feijó': '1200302',
    'Brasileia': '1200104',
    'Plácido de Castro': '1200385',
    'Xapuri': '1200708'
  },
  'AP': {
    'Macapá': '1600303',
    'Santana': '1600600',
    'Laranjal do Jari': '1600279',
    'Oiapoque': '1600501',
    'Porto Grande': '1600535',
    'Mazagão': '1600402',
    'Pedra Branca do Amapari': '1600154',
    'Vitória do Jari': '1600808'
  },
  'AM': {
    'Manaus': '1302603',
    'Parintins': '1303403',
    'Itacoatiara': '1301902',
    'Manacapuru': '1302504',
    'Coari': '1301209',
    'Tefé': '1304203',
    'Tabatinga': '1304104',
    'Maués': '1302900'
  },
  'RO': {
    'Porto Velho': '1100205',
    'Ji-Paraná': '1100122',
    'Ariquemes': '1100023',
    'Vilhena': '1100304',
    'Cacoal': '1100049',
    'Rolim de Moura': '1100254',
    'Jaru': '1100114',
    'Guajará-Mirim': '1100106'
  },
  'RR': {
    'Boa Vista': '1400100',
    'Rorainópolis': '1400472',
    'Caracaraí': '1400209',
    'Alto Alegre': '1400050',
    'Mucajaí': '1400308',
    'Bonfim': '1400159',
    'Cantá': '1400175',
    'Normandia': '1400407'
  },
  'TO': {
    'Palmas': '1721000',
    'Araguaína': '1702109',
    'Gurupi': '1709500',
    'Porto Nacional': '1718204',
    'Paraíso do Tocantins': '1716109',
    'Colinas do Tocantins': '1705508',
    'Guaraí': '1709302',
    'Tocantinópolis': '1721208'
  },
  'MT': {
    'Cuiabá': '5103403',
    'Várzea Grande': '5108402',
    'Rondonópolis': '5107602',
    'Sinop': '5107909',
    'Tangará da Serra': '5107958',
    'Cáceres': '5102504',
    'Sorriso': '5107925',
    'Lucas do Rio Verde': '5105234'
  },
  'MS': {
    'Campo Grande': '5002704',
    'Dourados': '5003488',
    'Três Lagoas': '5008305',
    'Corumbá': '5003207',
    'Ponta Porã': '5006606',
    'Naviraí': '5005707',
    'Nova Andradina': '5006200',
    'Sidrolândia': '5007802'
  },
  'DF': {
    'Brasília': '5300108'
  },
  'ES': {
    'Vitória': '3205309',
    'Vila Velha': '3205200',
    'Cariacica': '3201308',
    'Serra': '3205002',
    'Cachoeiro de Itapemirim': '3201209',
    'Linhares': '3203205',
    'São Mateus': '3204906',
    'Colatina': '3201506'
  }
}

// Função para buscar código do município
export function getMunicipioCode(cidade: string, uf: string): string | null {
  const municipios = MUNICIPIO_CODES[uf]
  if (!municipios) return null
  
  // Busca exata primeiro
  if (municipios[cidade]) {
    return municipios[cidade]
  }
  
  // Busca case-insensitive
  const cidadeNormalizada = cidade.toLowerCase()
  for (const [nome, codigo] of Object.entries(municipios)) {
    if (nome.toLowerCase() === cidadeNormalizada) {
      return codigo
    }
  }
  
  return null
}

// Função para buscar código da UF
export function getUFCode(uf: string): string | null {
  return UF_CODES[uf] || null
}

// Função para validar se um código de município é válido
export function isValidMunicipioCode(codigo: string): boolean {
  return /^\d{7}$/.test(codigo)
}

// Função para validar se um código de UF é válido
export function isValidUFCode(codigo: string): boolean {
  return Object.values(UF_CODES).includes(codigo)
}