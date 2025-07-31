import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const FocusLogin = () => {
  // Credenciais da Focus NFe
  const FOCUS_EMAIL = 'contato@fluxiwave.com.br';
  const FOCUS_PASSWORD = 'Gpv@162017';
  const FOCUS_LOGIN_URL = 'https://app-v2.focusnfe.com.br/login';
  const FOCUS_REDIRECT_URL = 'https://app-v2.focusnfe.com.br/minhas_empresas/empresas';

  useEffect(() => {
    // Auto-submit o formulário após 2 segundos
    const timer = setTimeout(() => {
      const form = document.getElementById('focus-login-form') as HTMLFormElement;
      if (form) {
        form.submit();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">
          Fazendo login na Focus NFe...
        </h1>
        <p className="text-muted-foreground">
          Aguarde enquanto redirecionamos você automaticamente.
        </p>
      </div>

      {/* Formulário hidden para auto-submit */}
      <form
        id="focus-login-form"
        method="POST"
        action={FOCUS_LOGIN_URL}
        style={{ display: 'none' }}
      >
        <input
          type="email"
          name="email"
          value={FOCUS_EMAIL}
          readOnly
        />
        <input
          type="password"
          name="password"
          value={FOCUS_PASSWORD}
          readOnly
        />
        <input
          type="hidden"
          name="redirect_url"
          value={FOCUS_REDIRECT_URL}
        />
      </form>
    </div>
  );
};

export default FocusLogin;