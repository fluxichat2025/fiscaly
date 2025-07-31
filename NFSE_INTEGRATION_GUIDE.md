# Guia de Integração NFSe - Focus NFe API

## Visão Geral

A página de Emitir NFSe foi completamente integrada com a API Focus NFe, permitindo a emissão de Notas Fiscais de Serviços Eletrônicas diretamente do sistema.

## Funcionalidades Implementadas

### ✅ Funcionalidades Completas

1. **Formulário Completo de NFSe**
   - Dados do tomador (cliente)
   - Dados do serviço prestado
   - Cálculos automáticos de valores
   - Validação de campos obrigatórios

2. **Integração com API Focus NFe**
   - Emissão de NFSe via API
   - Consulta de status da NFSe
   - Tratamento de erros
   - Feedback visual do processo

3. **Seleção de Empresa**
   - Lista empresas cadastradas na Focus NFe
   - Utiliza tokens específicos de cada empresa

4. **Cálculos Automáticos**
   - Valor total dos serviços
   - Valor do ISS baseado na alíquota
   - Valor líquido

5. **Estados Visuais**
   - Loading durante processamento
   - Status de autorização
   - Indicadores de erro

## Campos Obrigatórios

### Dados do Tomador
- Tipo de documento (CPF/CNPJ)
- Documento (CPF/CNPJ)
- Razão Social/Nome
- E-mail
- CEP, Endereço, Número
- Bairro, Cidade, UF

### Dados do Serviço
- Descrição do serviço
- Quantidade
- Valor unitário
- Alíquota ISS (%)
- Item da lista de serviços (ex: 1.01)
- Código tributário do município

### Campos Opcionais
- Telefone do tomador
- Complemento do endereço
- Código CNAE

## Como Usar

1. **Selecionar Empresa**
   - Escolha a empresa emitente na lista
   - Certifique-se de que a empresa está habilitada para NFSe

2. **Preencher Dados do Tomador**
   - Selecione CPF ou CNPJ
   - Preencha todos os campos obrigatórios
   - O sistema valida formato de e-mail automaticamente

3. **Preencher Dados do Serviço**
   - Descreva detalhadamente o serviço
   - Informe quantidade e valor unitário
   - O valor total é calculado automaticamente
   - Defina a alíquota ISS (geralmente 2% a 5%)
   - O valor do ISS é calculado automaticamente

4. **Configurações**
   - Marque se deseja enviar por e-mail
   - Marque se deseja gerar PDF automaticamente

5. **Emitir NFSe**
   - Clique em "Emitir NFSe"
   - Acompanhe o status no painel lateral
   - A NFSe será processada assincronamente

## Status da NFSe

- **Processando**: NFSe foi enviada e está sendo processada
- **Autorizada**: NFSe foi autorizada com sucesso
- **Erro**: Ocorreu erro na emissão ou autorização

## Exemplo de Dados de Teste

### Tomador Pessoa Física
```
Tipo: CPF
Documento: 123.456.789-00
Nome: João da Silva
E-mail: joao@exemplo.com
CEP: 01310-100
Endereço: Av. Paulista
Número: 1000
Bairro: Bela Vista
Cidade: São Paulo
UF: SP
```

### Serviço de Desenvolvimento
```
Descrição: Desenvolvimento de sistema web personalizado
Quantidade: 1
Valor Unitário: 5000.00
Alíquota ISS: 5%
Item Lista Serviços: 1.01
Código Tributário: (específico do município)
```

## Códigos de Serviço Comuns

- **1.01** - Análise e desenvolvimento de sistemas
- **1.02** - Programação
- **1.03** - Processamento de dados
- **1.04** - Elaboração de programas de computadores
- **1.05** - Licenciamento ou cessão de direito de uso de programas

## Observações Importantes

1. **Certificado Digital**: Necessário certificado digital válido na empresa
2. **Inscrição Municipal**: Empresa deve estar inscrita no município
3. **Código Tributário**: Varia por município, consulte a prefeitura
4. **Ambiente**: Atualmente configurado para produção
5. **Tokens**: Cada empresa possui tokens específicos

## Próximas Funcionalidades

### 🔄 Em Desenvolvimento
- Salvar rascunho
- Pré-visualização da NFSe
- Histórico de NFSe emitidas
- Cancelamento de NFSe
- Reenvio por e-mail

### 📋 Planejadas
- Templates de serviços
- Importação de dados via CSV
- Relatórios de NFSe
- Integração com contabilidade

## Suporte Técnico

Para dúvidas sobre a API Focus NFe:
- Documentação: https://focusnfe.com.br/doc/
- Suporte: suporte@focusnfe.com.br
- Fórum: https://forum.focusnfe.com.br/

## Estrutura de Arquivos

```
src/
├── pages/
│   └── EmitirNFSe.tsx          # Página principal
├── hooks/
│   └── useFocusNFeAPI.tsx      # Hook para API Focus NFe
└── components/
    └── ui/                     # Componentes de interface
```

## Tecnologias Utilizadas

- **React Hook Form**: Gerenciamento de formulários
- **Focus NFe API**: Emissão de NFSe
- **Shadcn/ui**: Componentes de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
