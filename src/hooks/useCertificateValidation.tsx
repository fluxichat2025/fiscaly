import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CertificateValidationResult {
  isValid: boolean;
  cnpj?: string;
  razaoSocial?: string;
  validUntil?: string;
  error?: string;
}

export function useCertificateValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateCertificate = async (
    certificateBase64: string,
    password: string
  ): Promise<CertificateValidationResult> => {
    setIsValidating(true);
    
    try {
      if (!certificateBase64 || !password) {
        throw new Error('Certificado e senha são obrigatórios');
      }

      // Chamar a API do Focus NFe para validar o certificado
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
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!data.success) {
        throw new Error(data.error || 'Senha do certificado inválida');
      }

      const result: CertificateValidationResult = {
        isValid: true,
        cnpj: data.cnpj,
        razaoSocial: data.razao_social,
        validUntil: data.valid_until
      };

      toast({
        title: "Certificado validado",
        description: "Certificado digital validado com sucesso!",
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação';
      
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: errorMessage,
      });

      return {
        isValid: false,
        error: errorMessage
      };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateCertificate,
    isValidating
  };
}