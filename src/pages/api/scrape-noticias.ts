import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

interface NoticiaScrapedData {
  titulo: string;
  resumo: string;
  data_publicacao: string;
  link_original: string;
  categoria: string;
  autor: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Iniciando scraping direto do Jornal Contábil...');

    // Fazer requisição HTTP direta para o site
    const response = await fetch('https://www.jornalcontabil.com.br/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ HTML obtido com sucesso, tamanho:', html.length);

    // Usar Cheerio para parsear o HTML
    const $ = cheerio.load(html);
    const noticias: NoticiaScrapedData[] = [];

    // Tentar diferentes seletores para encontrar as notícias
    const possibleSelectors = [
      '.mvp-feat-text-wrap a', // Seletor comum para links de notícias
      '.mvp-main-blog-story-wrap a', // Outro seletor possível
      'article a[href*="/noticia/"]', // Links que contêm "/noticia/"
      'a[href*="jornalcontabil.com.br/noticia/"]', // Links completos de notícias
      '.post-title a', // Títulos de posts
      '.entry-title a' // Títulos de entradas
    ];

    console.log('🔍 Tentando extrair notícias com diferentes seletores...');

    for (const selector of possibleSelectors) {
      const links = $(selector);
      console.log(`🔍 Seletor "${selector}" encontrou ${links.length} elementos`);

      if (links.length > 0) {
        links.each((index, element) => {
          if (noticias.length >= 7) return false; // Limitar a 7 notícias

          const $link = $(element);
          const href = $link.attr('href');
          const titulo = $link.text().trim() || $link.attr('title')?.trim();

          if (href && titulo && href.includes('/noticia/')) {
            // Garantir URL completa
            const linkCompleto = href.startsWith('http') 
              ? href 
              : `https://www.jornalcontabil.com.br${href}`;

            // Tentar extrair categoria do contexto
            const categoria = extractCategoriaFromContext($link);
            
            // Tentar extrair tempo de publicação
            const tempo = extractTempoFromContext($link);

            const noticia: NoticiaScrapedData = {
              titulo: titulo.substring(0, 200), // Limitar tamanho
              resumo: generateResumoFromTitulo(titulo),
              data_publicacao: calculateDataFromTempo(tempo),
              link_original: linkCompleto,
              categoria: categoria || 'Geral',
              autor: 'Jornal Contábil'
            };

            // Evitar duplicatas
            if (!noticias.some(n => n.link_original === linkCompleto)) {
              noticias.push(noticia);
              console.log(`✅ Notícia extraída: ${titulo.substring(0, 50)}...`);
            }
          }
        });

        if (noticias.length > 0) {
          break; // Se encontrou notícias, parar de tentar outros seletores
        }
      }
    }

    // Se não encontrou notícias com seletores específicos, tentar busca mais ampla
    if (noticias.length === 0) {
      console.log('⚠️  Tentando busca mais ampla por links de notícias...');
      
      $('a[href*="/noticia/"]').each((index, element) => {
        if (noticias.length >= 7) return false;

        const $link = $(element);
        const href = $link.attr('href');
        const titulo = $link.text().trim();

        if (href && titulo && titulo.length > 10) {
          const linkCompleto = href.startsWith('http') 
            ? href 
            : `https://www.jornalcontabil.com.br${href}`;

          const noticia: NoticiaScrapedData = {
            titulo: titulo.substring(0, 200),
            resumo: generateResumoFromTitulo(titulo),
            data_publicacao: new Date().toISOString(),
            link_original: linkCompleto,
            categoria: 'Geral',
            autor: 'Jornal Contábil'
          };

          if (!noticias.some(n => n.link_original === linkCompleto)) {
            noticias.push(noticia);
          }
        }
      });
    }

    console.log(`✅ Scraping concluído: ${noticias.length} notícias encontradas`);

    // Se ainda não encontrou notícias, usar dados de fallback
    if (noticias.length === 0) {
      console.log('⚠️  Nenhuma notícia encontrada, usando dados de fallback');
      return res.status(200).json({
        success: true,
        noticias: getFallbackNoticias(),
        fallback: true,
        message: 'Usando dados de exemplo - site pode ter mudado estrutura'
      });
    }

    return res.status(200).json({
      success: true,
      noticias: noticias.slice(0, 7), // Garantir máximo de 7
      total: noticias.length
    });

  } catch (error) {
    console.error('❌ Erro no scraping:', error);
    
    // Retornar dados de fallback em caso de erro
    return res.status(200).json({
      success: true,
      noticias: getFallbackNoticias(),
      fallback: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Funções auxiliares
function extractCategoriaFromContext($element: cheerio.Cheerio<cheerio.Element>): string {
  const categorias = ['INSS', 'Economia', 'Simples Nacional', 'Contabilidade', 'Fique Sabendo', 'Direito', 'Trabalhista', 'Impostos'];
  
  // Procurar categoria no texto próximo
  const contexto = $element.closest('article, .post, .entry, div').text();
  
  for (const categoria of categorias) {
    if (contexto.includes(categoria)) {
      return categoria;
    }
  }
  
  return 'Geral';
}

function extractTempoFromContext($element: cheerio.Cheerio<cheerio.Element>): string {
  const contexto = $element.closest('article, .post, .entry, div').text();
  const tempoRegex = /(\d+)\s+(minutos?|horas?)\s+ago/i;
  const match = contexto.match(tempoRegex);
  return match ? match[0] : '';
}

function calculateDataFromTempo(tempo: string): string {
  const agora = new Date();
  
  if (!tempo) return agora.toISOString();
  
  const match = tempo.match(/(\d+)\s+(minutos?|horas?)/i);
  if (!match) return agora.toISOString();
  
  const valor = parseInt(match[1]);
  const unidade = match[2].toLowerCase();
  
  if (unidade.includes('minuto')) {
    agora.setMinutes(agora.getMinutes() - valor);
  } else if (unidade.includes('hora')) {
    agora.setHours(agora.getHours() - valor);
  }
  
  return agora.toISOString();
}

function generateResumoFromTitulo(titulo: string): string {
  if (titulo.length > 100) {
    return titulo.substring(0, 97) + '...';
  }
  return `Saiba mais sobre: ${titulo}`;
}

function getFallbackNoticias(): NoticiaScrapedData[] {
  const agora = new Date();
  
  return [
    {
      titulo: 'INSS dá prazo de 120 dias para resgate de importante benefício',
      resumo: 'O crédito bancário das restituições terá um valor total significativo para os beneficiários.',
      data_publicacao: new Date(agora.getTime() - 16 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/inss-da-prazo-de-120-dias-para-resgate-de-importante-beneficio/',
      categoria: 'INSS',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'Às vésperas de início da taxa, CACB alerta para efeito nas micro e pequenas empresas',
      resumo: 'Confederação alerta sobre impactos da nova taxa nas pequenas empresas.',
      data_publicacao: new Date(agora.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/as-vesperas-de-inicio-da-taxa-cacb-alerta-para-efeito-nas-micro-e-pequenas-empresas/',
      categoria: 'Economia',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'IOF: Pequenas empresas sentem o peso do aumento no custo do crédito',
      resumo: 'Aumento do IOF impacta diretamente o custo de financiamento para pequenos negócios.',
      data_publicacao: new Date(agora.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/iof-pequenas-empresas-sentem-o-peso-do-aumento-no-custo-do-credito/',
      categoria: 'Simples Nacional',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'Reforma Tributária: Novas alterações para CT-e, CR-eOS e GTV-e',
      resumo: 'As Regras de Validação serão aplicadas a partir de janeiro de 2026.',
      data_publicacao: new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/reforma-tributaria-novas-alteracoes-para-ct-e-cr-eos-e-gtv-e/',
      categoria: 'Contabilidade',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'Cinco falhas que impedem empresas de crescerem por falta de inteligência analítica',
      resumo: 'Tomar decisões baseadas apenas em intuição ainda é realidade para muitas empresas.',
      data_publicacao: new Date(agora.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/cinco-falhas-que-impedem-empresas-de-crescerem-por-falta-de-inteligencia-analitica/',
      categoria: 'Fique Sabendo',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'Tentativas de fraudes atingem 2,8% das transações no 1º semestre',
      resumo: 'Dados mostram crescimento nas tentativas de fraude em transações digitais.',
      data_publicacao: new Date(agora.getTime() - 21 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/tentativas-de-fraudes-atingem-28-das-transacoes-no-1o-semestre-revela-acertpix/',
      categoria: 'Fique Sabendo',
      autor: 'Jornal Contábil'
    },
    {
      titulo: 'MEI e Contador: parceria para o sucesso do seu negócio',
      resumo: 'Entenda como a parceria entre MEI e contador pode impulsionar o crescimento.',
      data_publicacao: new Date(agora.getTime() - 22 * 60 * 60 * 1000).toISOString(),
      link_original: 'https://www.jornalcontabil.com.br/noticia/mei-e-contador-parceria-para-o-sucesso-do-seu-negocio/',
      categoria: 'Contabilidade',
      autor: 'Jornal Contábil'
    }
  ];
}
