import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Clock, Sparkles, ArrowRight, FileText, TrendingUp } from 'lucide-react'

const ImpostoRenda = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Imposto de Renda</h1>
            <p className="text-sm text-muted-foreground">Gestão completa do seu Imposto de Renda</p>
          </div>
        </div>

        {/* Card principal "Em breve" */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-2xl text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Calculator className="h-16 w-16 text-green-500" />
                  <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Imposto de Renda</CardTitle>
              <p className="text-muted-foreground">
                Módulo completo para gestão e cálculo do seu Imposto de Renda
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                  <Clock className="h-5 w-5" />
                  Lançamento em breve
                </div>
                <p className="text-sm text-green-600">
                  Estamos desenvolvendo uma solução completa para simplificar sua declaração de IR
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recursos planejados:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Importação automática de dados
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Cálculo automático de impostos
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Geração de DARF
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Relatórios detalhados
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Benefícios:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Conformidade fiscal
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Otimização tributária
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Redução de riscos
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      Economia de tempo
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs font-medium">Declarações</p>
                  <p className="text-xs text-muted-foreground">Pessoa Física e Jurídica</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calculator className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-xs font-medium">Cálculos</p>
                  <p className="text-xs text-muted-foreground">Automáticos e precisos</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-xs font-medium">Planejamento</p>
                  <p className="text-xs text-muted-foreground">Tributário inteligente</p>
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

export default ImpostoRenda
