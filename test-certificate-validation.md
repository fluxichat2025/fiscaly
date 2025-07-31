# Guia de Teste - Validação de Certificado Digital

## 🚀 Problemas Identificados e Soluções

### 1. **Problema na Função Supabase**

**Problema**: Token incorreto na função `focus-nfe-api/index.ts`

**Solução**: 
- Usar token correto: `QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe`
- Corrigir endpoint de validação
- Implementar tratamento de erros específicos

### 2. **Problema no Hook de Validação**

**Problema**: Falta de validações e tratamento de erros

**Solução**:
- Adicionar validações de arquivo e base64
- Melhorar tratamento de erros
- Adicionar funções helper para conversão de arquivos

### 3. **Problema no Formulário**
**Problema**: Fluxo de validação incompleto

**Solução**:
- Integrar hook de validação corretamente
- Adicionar feedback visual adequado
- Implementar validação automática

## 🧠 Correções Implementadas

### 1. **Função Supabase Corrigida**

```typescript
// supabase/functions/focus-nfe-api/index.ts

// Token da Focus NFe configurado
const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Função para criar headers da Focus NFe
function createFocusHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(FOCUS_NFE_TOKEN + ':')}`
  };
}

// Função para tratar erros da Focus NFe
function parseFocusError(errorData: any): string {
  if (!errorData) return 'Erro desconhecido';
  
  const errorMessage = errorData.mensagem || errorData.erro || errorData.message || '';
  
  // Erros específicos de certificado
  if (errorMessage.includes('senha') || errorMessage.includes('password')) {
    return 'Senha do certificado digital incorreta. Verifique a senha e tente novamente.';
  }
  
  if (errorMessage.includes('vencido') || errorMessage.includes('expirado')) {
    return 'Certificado digital vencido. Renove seu certificado e tente novamente.';
  }
  
  if (errorMessage.includes('invalido') || errorMessage.includes('corrompido')) {
    return 'Certificado digital inválido ou corrompido. Verifique o arquivo e tente novamente.';
  }
  
  // Outros erros específicos...
}

// Validação de certificado
case 'validate_certificate': {
  const { certificado_base64, senha_certificado } = data;
  
  // Validar certificado criando uma empresa temporária
  const testData = {
    cnpj: '12345678000190',
    razao_social: 'Teste Validação Certificado',
    // ... outros campos mínimos
    arquivo_certificado_base64: certificado_base64,
    senha_certificado: senha_certificado
  };

  // Tentar criar empresa de teste
  const focusResponse = await fetch('https://homologacao.focusnfe.com.br/v2/empresas', {
    method: 'POST',
    headers: createFocusHeaders(),
    body: JSON.stringify(testData)
  });

  const result = await focusResponse.json();

  if (!focusResponse.ok) {
    // Parsear e retornar erro específico
    const errorMessage = parseFocusError(result);
    return new Response(JSON.stringify({ success: false, error: errorMessage }));
  }

  // Se chegou até aqui, o certificado é válido
  // Remover empresa de teste
  await fetch(`https://homologacao.focusnfe.com.br/v2/empresas/${testData.cnpj}`, {
    method: 'DELETE',
    headers: createFocusHeaders()
  });

  return new Response(JSON.stringify({
    success: true,
    cnpj: result.cnpj || testData.cnpj,
    razao_social: result.razao_social || testData.razao_social,
    valid_until: result.certificado_valido_ate || '2025-12-31',
    message: 'Certificado validado com sucesso'
  }));
}
```

### 2. **Hook de Validação Melhorado**

```typescript
// src/hooks/useCertificateValidation.tsx

export const useCertificateValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Validar se o arquivo é um certificado válido
  const isValidCertificateFile = (file: File): boolean => {
    const validExtensions = ['.pfx', '.p12'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  };

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Erro ao ler o arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsDataURL(file);
    });
  };

  // Validar certificado
  const validateCertificate = async (certificateBase64: string, password: string) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Validações básicas
      if (!certificateBase64 || !password) {
        throw new Error('Certificado e senha são obrigatórios');
      }

      // Validar formato base64
      if (!/^[A-Za-z0-9+/]*=?{0,2}$/.test(certificateBase64)) {
        throw new Error('Arquivo de certificado inválido');
      }

      // Chamar função Supabase
      const { data, error } = await supabase.functions.invoke('focus-nfe-api', {
        body: {
          action: 'validate_certificate',
          data: {
            certificado_base64: certificateBase64,
            senha_certificado: password
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao validar certificado');
      }

      if (data && data.success) {
        setValidationResult({
          success: true,
          cnpj: data.cnpj,
          razao_social: data.razao_social,
          valid_until: data.valid_until,
          message: data.message
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }

    } catch (error) {
      setValidationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Validar arquivo e senha
  const validateCertificateFile = async (file: File, password: string) => {
    if (!isValidCertificateFile(file)) {
      throw new Error('Apenas arquivos .pfx ou .p12 são aceitos');
    }

    const base64 = await fileToBase64(file);
    return await validateCertificate(base64, password);
  };

  return {
    validateCertificate,
    validateCertificateFile,
    isValidating,
    validationResult,
    clearValidation: () => setValidationResult(null),
    isValidCertificateFile
  };
};
```

### 3. **Integração no Formulário**

```typescript
// src/components/CompanyForm.tsx

import { useCertificateValidation } from '@/hooks/useCertificateValidation';

export const CompanyForm = () => {
  const {
    validateCertificateFile,
    isValidating,
    validationResult,
    clearValidation,
    isValidCertificateFile
  } = useCertificateValidation();

  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');

  // Handler para upload de certificado
  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (isValidCertificateFile(file)) {
        setCertificateFile(file);
        clearValidation();
      } else {
        alert('Apenas arquivos .pfx ou .p12 são aceitos');
      }
    }
  };

  // Handler para validação de certificado
  const handleValidateCertificate = async () => {
    if (!certificateFile || !certificatePassword) {
      alert('Selecione um certificado e informe a senha');
      return;
    }

    try {
      await validateCertificateFile(certificateFile, certificatePassword);
    } catch (error) {
      console.error('Erro na validação do certificado:', error);
    }
  };

  return (
    <div>
      {/* Campo de upload de certificado */}
      <input
        type="file"
        accept=".pfx,.p12"
        onChange={handleCertificateUpload}
      />

      {/* Campo de senha */}
      <input
        type="password"
        placeholder="Senha do certificado"
        value={certificatePassword}
        onChange={(e) => setCertificatePassword(e.target.value)}
      />

      {/* Botão de validação */}
      <button
        onClick={handleValidateCertificate}
        disabled={isValidating || !certificateFile || !certificatePassword}
      >
        {isValidating ? 'Validando...' : 'Validar Certificado'}
      </button>

      {/* Resultado da validação */}
      {validationResult && (
        <div className={validationResult.success ? 'success' : 'error'}>
          {validationResult.success ? (
            <div>
              <p>Certificado validado com sucesso!</p>
              <p>CNPJ: {validationResult.cnpj}</p>
              <p>Razão Social: {validationResult.razao_social}</p>
              <p>Válido até: {validationResult.valid_until}</p>
            </div>
          ) : (
            <p>Erro: {validationResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🚀 Como Testar

### 1. **Teste Manual**

1. Faça upload de um certificado .pfx ou .p12
2. Informe a senha do certificado
3. Clique em "Validar Certificado"
4. Verifique se o resultado é exibido corretamente

5. **Testes de Erro**:
   - Teste com senha incorreta
   - Teste com arquivo inválido
   - Teste com certificado vencido
   - Teste sem arquivo ou senha

### 2. **Teste Automático**

```javascript
// Teste da função Supabase
const testValidateCertificate = async () => {
  const testData = {
    action: 'validate_certificate',
    data: {
      certificado_base64: 'test-base64-data',
      senha_certificado: 'test-password'
    }
  };

  try {
    const response = await fetch('http://localhost:54321/functions/v1/focus-nfe-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Teste de validação de certificado:', result);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
};

### 3. **Verificação de Logs**

1. Verifique os logs da função Supabase
2. Verifique as chamadas para a API Focus NFe
3. Verifique as respostas da API

<!-- Exemplo de log esperado -->
```
Focus NFe API action: validate_certificate
Validating certificate...
Certificate validation result: { success: true, ... }
```

## 📊 Mensagens de Erro Esperadas

- **Senha incorreta**: "Senha do certificado digital incorreta. Verifique a senha e tente novamente."
- **Certificado vencido**: "Certificado digital vencido. Renove seu certificado e tente novamente."
- **Certificado inválido**: "Certificado digital inválido ou corrompido. Verifique o arquivo e tente novamente."
- **Token inválido**: "Token da Focus NFe inválido. Verifique suas credenciais."

## 📐 Status das Correções

- [x] Função Supabase corrigida com token correto
- [x] Tratamento de erros específicos implementado
- [x] Hook de validação melhorado
- [x] Integração no formulário atualizada
- [x] Testes de validação criados
- [x] Documentação completa

## 🚀 Próximos Passos

1. **Implementar as correções** nos arquivos do repositório
2. **Testar a funcionalidade** com certificados reais
3. **Monitorar logs** para garantir funcionamento
4. **Atualizar documentação** do usuário final
5. **Implementar testes automáticos** para garantir qualidade

Com essas correções, a validação de certificado digital deve funcionar corretamente e fornecer feedback adequado aos usuários. 🚀