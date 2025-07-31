# Guia de Teste - Validação de Certificado Digital

Este guia explica como testar a funcionalidade de validação de certificado digital no sistema.

## Correções Realizadas

1. **Correção do Token**: Atualizado o token da Focus NFe para `QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe`
2. **Correção do Endpoint**: Removido o endpoint inexistente `/v2/certificados/validar`
3. **Implementação de Validação**: Usando criação de empresa temporária para testar o certificado
4. **Melhor Tratamento de Erros**: Adicionadas mensagens específicas para diferentes tipos de erro
5. **Logs Detalhados**: Adicionados logs para facilitar o debug

## Como Testar

1. **Acesse o formulário de empresa**
2. **Faça upload de um certificado .pfx ou .p12**
3. **Informe a senha do certificado**
4. **Clique em "Validar"**

## Resultados Esperados

- **Sucesso:** Mensagem "Certificado validado com sucesso"
- **Erro de Senha:** "Senha do certificado digital incorreta"
- **Certificado Vencido:** "Certificado digital vencido"
- **Certificado Inválido:** "Certificado digital inválido ou corrompido"

## Debug

Se ainda houver problemas, verifique os logs no Supabase Edge Functions:

1. Acesse o Supabase Dashboard
2. Vá em Edge Functions
3. Selecione `focus-nfe-api`
4. Verifique os logs na aba "Logs"

## Arquivos Modificados

- `supabase/functions/focus-nfe-api/index.ts` - Função Supabase corrigida
- `src/hooks/useCertificateValidation.tsx` - Hook de validação (já existia)
- `src/components/CompanyForm.tsx` - Formulário (já existia)

## Token da Focus NFe

O token atual configurado é: `QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe`

Se precisar atualizar, modifique a constante `FOCUS_NFE_TOKEN` no arquivo `supabase/functions/focus-nfe-api/index.ts`.
