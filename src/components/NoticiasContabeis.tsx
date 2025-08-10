import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tipos da API externa de notícias
interface APINoticia {
  categoria: string;
  tempo: string;
  titulo: string;
  thumb: string;
  url: string;
}

interface NoticiasAPIResponse {
  status: string;
  total: number;
  noticias: APINoticia[];
  timestamp: string;
}


export function NoticiasContabeis() {
  const [noticias, setNoticias] = useState<APINoticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeNoticias();
  }, []);

  const initializeNoticias = async () => {
    console.log('🔍 Debug - initializeNoticias iniciado');
    await fetchNoticias();
  };

  const fetchNoticias = async () => {
    try {
      setError(null);
      console.log('🔍 Debug - fetchNoticias iniciado');

      const resp = await fetch('https://puppeteer.fluxichat.com.br/noticias');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: NoticiasAPIResponse = await resp.json();

      if (json.status !== 'sucesso') throw new Error('Status de API inválido');

      setNoticias(json.noticias || []);
      console.log('✅ Debug - Notícias carregadas da API externa:', json.noticias?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar notícias da API externa:', error);
      setError('Erro ao carregar notícias');
      setNoticias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Atualizando notícias a partir da API externa...');
      await fetchNoticias();
      toast({
        title: 'Notícias atualizadas',
        description: 'Exibindo as 20 últimas notícias',
      });
    } catch (error) {
      console.error('Erro ao atualizar notícias:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar as notícias agora.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleNoticiaClick = (noticia: APINoticia) => {
    window.open(noticia.url, '_blank');
  };

  const formatTempo = (tempo: string) => tempo;

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
              key={noticia.url}
              className="shadow-sm hover:shadow-md transition-all border-l-2 border-l-primary"
            >
              <CardContent className="p-2">
                <div className="flex items-start gap-2">
                  {/* Thumbnail */}
                  <img
                    src={noticia.thumb}
                    alt={noticia.titulo}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />

                  <div className="flex-1 space-y-1">
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

                    {/* Footer: tempo e botão */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-2 w-2" />
                        <span className="text-xs">{formatTempo(noticia.tempo)}</span>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-6 px-1 text-xs"
                        onClick={() => handleNoticiaClick(noticia)}
                      >
                        Mais detalhes
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
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
