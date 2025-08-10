import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { useCompanyNfseConfig, CompanyMunicipalTaxCode, CompanyServiceItem } from '@/hooks/useCompanyNfseConfig';

interface CompanyNfseConfigManagerProps {
  companyId: string;
}

interface EditingState {
  type: 'taxCode' | 'serviceItem' | null;
  id: string | null;
  isNew: boolean;
}

export const CompanyNfseConfigManager: React.FC<CompanyNfseConfigManagerProps> = ({ companyId }) => {
  const {
    config,
    loading,
    addMunicipalTaxCode,
    updateMunicipalTaxCode,
    removeMunicipalTaxCode,
    addServiceItem,
    updateServiceItem,
    removeServiceItem
  } = useCompanyNfseConfig(companyId);

  const [editing, setEditing] = useState<EditingState>({ type: null, id: null, isNew: false });
  const [newTaxCode, setNewTaxCode] = useState({ codigo_tributario_municipio: '', descricao: '' });
  const [newServiceItem, setNewServiceItem] = useState({ item_lista_servico: '', descricao: '' });
  const [editValues, setEditValues] = useState<any>({});

  const handleAddTaxCode = () => {
    setEditing({ type: 'taxCode', id: 'new', isNew: true });
    setNewTaxCode({ codigo_tributario_municipio: '', descricao: '' });
  };

  const handleAddServiceItem = () => {
    setEditing({ type: 'serviceItem', id: 'new', isNew: true });
    setNewServiceItem({ item_lista_servico: '', descricao: '' });
  };

  const handleEditTaxCode = (taxCode: CompanyMunicipalTaxCode) => {
    setEditing({ type: 'taxCode', id: taxCode.id!, isNew: false });
    setEditValues({
      codigo_tributario_municipio: taxCode.codigo_tributario_municipio,
      descricao: taxCode.descricao || ''
    });
  };

  const handleEditServiceItem = (serviceItem: CompanyServiceItem) => {
    setEditing({ type: 'serviceItem', id: serviceItem.id!, isNew: false });
    setEditValues({
      item_lista_servico: serviceItem.item_lista_servico,
      descricao: serviceItem.descricao || ''
    });
  };

  const handleSaveTaxCode = async () => {
    try {
      if (editing.isNew) {
        if (!newTaxCode.codigo_tributario_municipio.trim()) return;
        await addMunicipalTaxCode({
          company_id: companyId,
          codigo_tributario_municipio: newTaxCode.codigo_tributario_municipio,
          descricao: newTaxCode.descricao || undefined,
          ativo: true
        });
      } else {
        await updateMunicipalTaxCode(editing.id!, {
          codigo_tributario_municipio: editValues.codigo_tributario_municipio,
          descricao: editValues.descricao || undefined
        });
      }
      setEditing({ type: null, id: null, isNew: false });
      setEditValues({});
    } catch (error) {
      console.error('Error saving tax code:', error);
    }
  };

  const handleSaveServiceItem = async () => {
    try {
      if (editing.isNew) {
        if (!newServiceItem.item_lista_servico.trim()) return;
        await addServiceItem({
          company_id: companyId,
          item_lista_servico: newServiceItem.item_lista_servico,
          descricao: newServiceItem.descricao || undefined,
          ativo: true
        });
      } else {
        await updateServiceItem(editing.id!, {
          item_lista_servico: editValues.item_lista_servico,
          descricao: editValues.descricao || undefined
        });
      }
      setEditing({ type: null, id: null, isNew: false });
      setEditValues({});
    } catch (error) {
      console.error('Error saving service item:', error);
    }
  };

  const handleCancel = () => {
    setEditing({ type: null, id: null, isNew: false });
    setEditValues({});
    setNewTaxCode({ codigo_tributario_municipio: '', descricao: '' });
    setNewServiceItem({ item_lista_servico: '', descricao: '' });
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Municipal Tax Codes Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Códigos Tributários do Município</CardTitle>
            <Button onClick={handleAddTaxCode} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.municipalTaxCodes.map((taxCode) => (
            <div key={taxCode.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {editing.type === 'taxCode' && editing.id === taxCode.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`edit-tax-code-${taxCode.id}`}>Código</Label>
                      <Input
                        id={`edit-tax-code-${taxCode.id}`}
                        value={editValues.codigo_tributario_municipio}
                        onChange={(e) => setEditValues(prev => ({ ...prev, codigo_tributario_municipio: e.target.value }))}
                        placeholder="Ex: 332100001"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-tax-desc-${taxCode.id}`}>Descrição</Label>
                      <Input
                        id={`edit-tax-desc-${taxCode.id}`}
                        value={editValues.descricao}
                        onChange={(e) => setEditValues(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descrição opcional"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTaxCode} size="sm" variant="default">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium">{taxCode.codigo_tributario_municipio}</div>
                    {taxCode.descricao && (
                      <div className="text-sm text-muted-foreground">{taxCode.descricao}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditTaxCode(taxCode)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeMunicipalTaxCode(taxCode.id!)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new tax code form */}
          {editing.type === 'taxCode' && editing.isNew && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-tax-code">Código</Label>
                  <Input
                    id="new-tax-code"
                    value={newTaxCode.codigo_tributario_municipio}
                    onChange={(e) => setNewTaxCode(prev => ({ ...prev, codigo_tributario_municipio: e.target.value }))}
                    placeholder="Ex: 332100001"
                  />
                </div>
                <div>
                  <Label htmlFor="new-tax-desc">Descrição</Label>
                  <Input
                    id="new-tax-desc"
                    value={newTaxCode.descricao}
                    onChange={(e) => setNewTaxCode(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTaxCode} size="sm" variant="default">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {config.municipalTaxCodes.length === 0 && editing.type !== 'taxCode' && (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum código tributário cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Items Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Itens da Lista de Serviços</CardTitle>
            <Button onClick={handleAddServiceItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.serviceItems.map((serviceItem) => (
            <div key={serviceItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {editing.type === 'serviceItem' && editing.id === serviceItem.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`edit-service-code-${serviceItem.id}`}>Código</Label>
                      <Input
                        id={`edit-service-code-${serviceItem.id}`}
                        value={editValues.item_lista_servico}
                        onChange={(e) => setEditValues(prev => ({ ...prev, item_lista_servico: e.target.value }))}
                        placeholder="Ex: 140600"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-service-desc-${serviceItem.id}`}>Descrição</Label>
                      <Input
                        id={`edit-service-desc-${serviceItem.id}`}
                        value={editValues.descricao}
                        onChange={(e) => setEditValues(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descrição opcional"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveServiceItem} size="sm" variant="default">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium">{serviceItem.item_lista_servico}</div>
                    {serviceItem.descricao && (
                      <div className="text-sm text-muted-foreground">{serviceItem.descricao}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditServiceItem(serviceItem)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeServiceItem(serviceItem.id!)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new service item form */}
          {editing.type === 'serviceItem' && editing.isNew && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-service-code">Código</Label>
                  <Input
                    id="new-service-code"
                    value={newServiceItem.item_lista_servico}
                    onChange={(e) => setNewServiceItem(prev => ({ ...prev, item_lista_servico: e.target.value }))}
                    placeholder="Ex: 140600"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="new-service-desc">Descrição</Label>
                  <Input
                    id="new-service-desc"
                    value={newServiceItem.descricao}
                    onChange={(e) => setNewServiceItem(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveServiceItem} size="sm" variant="default">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {config.serviceItems.length === 0 && editing.type !== 'serviceItem' && (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum item de serviço cadastrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
