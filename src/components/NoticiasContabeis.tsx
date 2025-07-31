import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { NoticiaContabil } from '@/types/database';
import { NoticiasService } from '@/services/noticiasService';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkNoticiasTable, insertExampleNoticias } from '@/utils/checkNoticiasTable';

export function NoticiasContabeis() {
  const [noticias, setNoticias] = useState<NoticiaContabil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeNoticias();
  }, []);

  const initializeNoticias = async () => {
    console.log('🔍 Debug - initializeNoticias iniciado');

    // Verificar se a tabela existe
    const tableExists = await checkNoticiasTable();

    if (tableExists) {
      fetchNoticias();
    } else {
      console.log('⚠️  Tabela noticias_contabeis não existe. Usando dados de exemplo.');
      // Usar dados de exemplo se a tabela não existir
      setLoading(false);
    }
  };

  const fetchNoticias = async () => {
    try {
      setError(null);
      console.log('🔍 Debug - fetchNoticias iniciado');

      const { data, error } = await supabase
        .from('noticias_contabeis')
        .select('*')
        .eq('status', 'ativo')
        .order('data_publicacao', { ascending: false })
        .limit(7);

      console.log('🔍 Debug - Supabase response:', { data, error });

      if (error) throw error;

      setNoticias(data || []);
      console.log('✅ Debug - Notícias carregadas:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      setError('Erro ao carregar notícias');
      
      // Se a tabela não existir, mostrar notícias de exemplo
      setNoticias([
        {
          id: '1',
          titulo: 'Novas regras do eSocial entram em vigor',
          resumo: 'Empresas devem se adequar às mudanças no eSocial que passam a valer a partir deste mês',
          data_publicacao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          link_original: 'https://www.jornalcontabil.com.br/exemplo1',
          categoria: 'eSocial',
          fonte: 'Jornal Contábil',
          status: 'ativo' as const,
          visualizacoes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          titulo: 'Prazo para entrega da DIRF 2024',
          resumo: 'Receita Federal define prazo final para entrega da Declaração do Imposto de Renda Retido na Fonte',
          data_publicacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          link_original: 'https://www.jornalcontabil.com.br/exemplo2',
          categoria: 'Impostos',
          fonte: 'Jornal Contábil',
          status: 'ativo' as const,
          visualizacoes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          titulo: 'Mudanças na legislação trabalhista',
          resumo: 'Novas alterações na CLT afetam cálculos de folha de pagamento',
          data_publicacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          link_original: 'https://www.jornalcontabil.com.br/exemplo3',
          categoria: 'Trabalhista',
          fonte: 'Jornal Contábil',
          status: 'ativo' as const,
          visualizacoes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Iniciando atualização de notícias...');

      // Fazer scraping real das notícias
      console.log('🔍 Debug - Chamando NoticiasService.scrapNoticias()...');
      const scrapingResult = await NoticiasService.scrapNoticias();
      console.log('🔍 Debug - Resultado do scraping:', scrapingResult);

      if (scrapingResult.success && scrapingResult.noticias.length > 0) {
        console.log('✅ Debug - Scraping bem-sucedido, salvando notícias...');

        // Salvar notícias no Supabase
        const novasSalvas = await NoticiasService.salvarNoticias(scrapingResult.noticias);
        console.log('🔍 Debug - Notícias salvas:', novasSalvas);

        // Recarregar notícias do banco
        await fetchNoticias();

        toast({
          title: "Notícias atualizadas",
          description: `${novasSalvas} novas notícias foram carregadas`,
        });
      } else {
        console.log('⚠️  Debug - Scraping falhou ou sem notícias, recarregando do banco...');

        // Se o scraping falhar, apenas recarregar do banco
        await fetchNoticias();
        toast({
          title: "Notícias carregadas",
          description: "Exibindo notícias do cache local",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar notícias:', error);

      // Em caso de erro, tentar carregar do banco mesmo assim
      await fetchNoticias();

      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Exibindo notícias em cache. Verifique sua conexão.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleNoticiaClick = async (noticia: NoticiaContabil) => {
    // Incrementar visualizações
    try {
      await supabase
        .from('noticias_contabeis')
        .update({ visualizacoes: noticia.visualizacoes + 1 })
        .eq('id', noticia.id);
    } catch (error) {
      console.error('Erro ao atualizar visualizações:', error);
    }

    // Abrir link em nova aba
    window.open(noticia.link_original, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoriaColor = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'esocial': return 'bg-blue-100 text-blue-800';
      case 'impostos': return 'bg-red-100 text-red-800';
      case 'trabalhista': return 'bg-green-100 text-green-800';
      case 'contabilidade': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header Compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1">
            <Newspaper className="h-4 w-4" />
            Notícias
          </h2>
          <p className="text-xs text-muted-foreground">
            Atualizações contábeis
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs">Atualizar</span>
        </Button>
      </div>

      {/* Error State Compacto */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-2">
            <div className="flex items-center gap-1 text-yellow-800">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">{error} - Dados de exemplo</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notícias List Compacta */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {noticias.length > 0 ? (
          noticias.map((noticia) => (
            <Card
              key={noticia.id}
              className="shadow-sm hover:shadow-md transition-all cursor-pointer border-l-2 border-l-primary"
              onClick={() => handleNoticiaClick(noticia)}
            >
              <CardContent className="p-2">
                <div className="space-y-1">
                  {/* Título e Categoria */}
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-medium text-xs leading-tight line-clamp-2 flex-1">
                      {noticia.titulo}
                    </h3>
                    {noticia.categoria && (
                      <Badge
                        variant="secondary"
                        className={`text-xs px-1 py-0 h-4 ${getCategoriaColor(noticia.categoria)} flex-shrink-0`}
                      >
                        {noticia.categoria}
                      </Badge>
                    )}
                  </div>

                  {/* Resumo Compacto */}
                  {noticia.resumo && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {noticia.resumo}
                    </p>
                  )}

                  {/* Footer Compacto */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2 w-2" />
                      <span className="text-xs">{formatDate(noticia.data_publicacao || noticia.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-2 w-2" />
                      <span className="text-xs truncate">{noticia.fonte}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma notícia disponível</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2 h-6 px-2 text-xs"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Compacto */}
      {noticias.length > 0 && (
        <div className="text-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://www.jornalcontabil.com.br', '_blank')}
            className="text-xs text-muted-foreground hover:text-primary h-6 px-2"
          >
            Ver mais
            <ExternalLink className="h-2 w-2 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
