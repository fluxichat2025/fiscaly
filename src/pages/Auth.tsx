import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Tabs removido - apenas login disponível
import { Eye, EyeOff, Calculator } from 'lucide-react';

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  // handleSignUp removido - signup desabilitado

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img
            src="https://res.cloudinary.com/djuuse9oo/image/upload/v1753457762/fiscalia_1_uvyxfv.png"
            alt="Fiscalia Logo"
            className="h-12 w-auto"
          />
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-center">
              Sistema de gestão fiscal para escritórios de contabilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {/* Signup removido - apenas login disponível */}

              <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        required
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ao usar este sistema, você concorda com nossa política de privacidade
        </p>
      </div>
    </div>
  );
}
























