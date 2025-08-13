import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Clock, Sparkles, ArrowRight } from 'lucide-react'

const ConciliacaoBancaria = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Conciliação Bancária</h1>
            <p className="text-sm text-muted-foreground">Automatize a conciliação das suas contas bancárias</p>
          </div>
        </div>

        {/* Card principal "Em breve" */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-2xl text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Calculator className="h-16 w-16 text-blue-500" />
                  <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Conciliação Bancária</CardTitle>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento para automatizar a conciliação das suas contas bancárias
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-blue-700 font-medium mb-2">
                  <Clock className="h-5 w-5" />
                  Lançamento em breve
                </div>
                <p className="text-sm text-blue-600">
                  Estamos trabalhando para trazer a melhor experiência em conciliação bancária automática
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recursos planejados:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Importação automática de extratos
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Conciliação inteligente
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Relatórios de divergências
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Benefícios:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Economia de tempo
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Redução de erros
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Controle financeiro preciso
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Clock className="h-4 w-4 mr-2" />
                  Notificar quando disponível
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default ConciliacaoBancaria
