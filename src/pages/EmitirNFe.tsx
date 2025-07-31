import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertTriangle, Building, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmitirNFe = () => {
  const [activeTab, setActiveTab] = useState('destinatario');

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emitir NFe</h1>
            <p className="text-muted-foreground">
              Emissão de Nota Fiscal Eletrônica
            </p>
          </div>
        </div>

        {/* Alert informativo */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A emissão de NFe requer certificado digital válido e configuração prévia junto à SEFAZ.
          </AlertDescription>
        </Alert>

        {/* Formulário de emissão */}
        <Card>
          <CardHeader>
            <CardTitle>Nova NFe</CardTitle>
            <CardDescription>
              Preencha os dados para emitir uma nova Nota Fiscal Eletrônica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="destinatario" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Destinatário
                </TabsTrigger>
                <TabsTrigger value="produtos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="impostos" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Impostos
                </TabsTrigger>
                <TabsTrigger value="finalizacao" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Finalização
                </TabsTrigger>
              </TabsList>

              <TabsContent value="destinatario" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-pessoa">Tipo de Pessoa</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fisica">Pessoa Física</SelectItem>
                        <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf-cnpj">CPF/CNPJ</Label>
                    <Input id="cpf-cnpj" placeholder="000.000.000-00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao-social">Razão Social/Nome</Label>
                  <Input id="razao-social" placeholder="Nome completo ou razão social" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" placeholder="00000-000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" placeholder="Rua, Avenida..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" placeholder="123" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="produtos" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Produto/Serviço 1</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input id="codigo" placeholder="001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input id="descricao" placeholder="Descrição do produto" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input id="quantidade" type="number" placeholder="1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor-unitario">Valor Unitário</Label>
                      <Input id="valor-unitario" type="number" placeholder="0,00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor-total">Valor Total</Label>
                      <Input id="valor-total" type="number" placeholder="0,00" readOnly />
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  + Adicionar Produto
                </Button>
              </TabsContent>

              <TabsContent value="impostos" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cfop">CFOP</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CFOP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5101">5101 - Venda de produção do estabelecimento</SelectItem>
                        <SelectItem value="5102">5102 - Venda de mercadoria adquirida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="natureza">Natureza da Operação</Label>
                    <Input id="natureza" placeholder="Venda" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icms">ICMS (%)</Label>
                    <Input id="icms" type="number" placeholder="18" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipi">IPI (%)</Label>
                    <Input id="ipi" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pis">PIS (%)</Label>
                    <Input id="pis" type="number" placeholder="1.65" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="finalizacao" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    placeholder="Observações adicionais da nota fiscal"
                    rows={4}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Resumo da NFe</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Valor dos Produtos: R$ 0,00</div>
                    <div>Total dos Impostos: R$ 0,00</div>
                    <div>Frete: R$ 0,00</div>
                    <div className="font-semibold">Total da Nota: R$ 0,00</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">
                    Emitir NFe
                  </Button>
                  <Button variant="outline">
                    Salvar Rascunho
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmitirNFe;