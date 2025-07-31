import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Focus NFe Auto Login request received')

    // Credenciais para login automático
    const loginData = {
      email: 'contato@fluxiwave.com.br',
      password: 'Gpv@162017'
    }

    console.log('Tentando fazer login na Focus NFe...')

    // Passo 1: Obter página de login para extrair CSRF token
    const loginPageResponse = await fetch('https://app-v2.focusnfe.com.br/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      }
    })

    const loginPageHtml = await loginPageResponse.text()
    console.log('Página de login obtida')

    // Extrair CSRF token
    const csrfMatch = loginPageHtml.match(/name="_token"[^>]*value="([^"]*)"/)
    const csrfToken = csrfMatch ? csrfMatch[1] : ''
    console.log('CSRF Token:', csrfToken ? 'encontrado' : 'não encontrado')

    // Extrair cookies da resposta
    const cookies = loginPageResponse.headers.get('set-cookie') || ''
    console.log('Cookies iniciais obtidos')

    // Passo 2: Fazer POST para login
    const loginResponse = await fetch('https://app-v2.focusnfe.com.br/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://app-v2.focusnfe.com.br/login',
        'Origin': 'https://app-v2.focusnfe.com.br',
        'Cookie': cookies,
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      },
      body: new URLSearchParams({
        email: loginData.email,
        password: loginData.password,
        _token: csrfToken
      }).toString()
    })

    console.log('Login response status:', loginResponse.status)
    
    // Obter cookies de sessão da resposta de login
    const sessionCookies = loginResponse.headers.get('set-cookie') || cookies
    console.log('Cookies de sessão obtidos')

    // Passo 3: Acessar página de empresas com sessão
    const empresasResponse = await fetch('https://app-v2.focusnfe.com.br/minhas_empresas/empresas', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': sessionCookies,
        'Referer': 'https://app-v2.focusnfe.com.br/dashboard',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    })

    console.log('Empresas response status:', empresasResponse.status)

    if (empresasResponse.ok) {
      const empresasHtml = await empresasResponse.text()
      
      // Extrair apenas a seção de empresas
      const empresasSectionMatch = empresasHtml.match(/<div[^>]*class="[^"]*empresas[^"]*"[^>]*>.*?<\/div>/s) ||
                                   empresasHtml.match(/<section[^>]*>.*?<table[^>]*>.*?<\/table>.*?<\/section>/s) ||
                                   empresasHtml.match(/<div[^>]*>.*?Pesquisa de Empresas.*?<\/div>.*?<div[^>]*>.*?<table[^>]*>.*?<\/table>.*?<\/div>/s)

      let filteredHtml = empresasHtml
      
      // Se encontrou a seção específica, usar apenas ela
      if (empresasSectionMatch) {
        filteredHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Focus NFe - Empresas</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .container { max-width: 1200px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              ${empresasSectionMatch[0]}
            </div>
          </body>
          </html>
        `
      }

      return new Response(filteredHtml, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': sessionCookies
        }
      })
    } else {
      throw new Error(`Falha ao acessar página de empresas: ${empresasResponse.status}`)
    }

  } catch (error) {
    console.error('Erro no auto login:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Falha no login automático', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
