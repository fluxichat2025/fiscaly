import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Focus NFe Login request received')

    // Credentials for automatic login
    const loginData = {
      email: 'contato@fluxiwave.com.br',
      password: 'Gpv@162017'
    }

    console.log('Attempting login to Focus NFe...')

    // Step 1: Get login page to extract any CSRF tokens
    const loginPageResponse = await fetch('https://app-v2.focusnfe.com.br/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const cookies = loginPageResponse.headers.get('set-cookie') || ''
    console.log('Initial cookies:', cookies)

    // Step 2: Perform login
    const formData = new FormData()
    formData.append('email', loginData.email)
    formData.append('password', loginData.password)

    const loginResponse = await fetch('https://app-v2.focusnfe.com.br/login', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://app-v2.focusnfe.com.br/login',
        'Cookie': cookies
      },
      body: formData,
      redirect: 'manual'
    })

    console.log('Login response status:', loginResponse.status)
    
    // Get session cookies from login response
    const sessionCookies = loginResponse.headers.get('set-cookie') || cookies
    console.log('Session cookies:', sessionCookies)

    // Step 3: Access the companies page with session
    const companiesResponse = await fetch('https://app-v2.focusnfe.com.br/minhas_empresas/empresas', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': sessionCookies,
        'Referer': 'https://app-v2.focusnfe.com.br/dashboard'
      }
    })

    console.log('Companies page response status:', companiesResponse.status)

    if (companiesResponse.ok) {
      const html = await companiesResponse.text()
      
      return new Response(JSON.stringify({ 
        success: true, 
        html: html,
        cookies: sessionCookies,
        redirectUrl: 'https://app-v2.focusnfe.com.br/minhas_empresas/empresas'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      throw new Error(`Failed to access companies page: ${companiesResponse.status}`)
    }

  } catch (error) {
    console.error('Error in Focus NFe login:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      fallbackUrl: 'https://app-v2.focusnfe.com.br/minhas_empresas/empresas'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})