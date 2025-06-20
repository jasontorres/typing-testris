// Public API Proxy - NO SECRETS HERE
// This is what your frontend calls - completely safe to inspect

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // CORS headers - restrict to your domain only (but allow curl for testing)
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://979f7cb6.typing-testris-97z.pages.dev',
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Simple rate limiting using KV
      const rateLimitKey = `rate_limit:${clientIP}:${request.method}:${path}`;
      const currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      // Rate limits per endpoint
      const limits = {
        'GET': 100,   // 100 GET requests per minute
        'POST': 10,   // 10 POST requests per minute
      };
      
      const limit = limits[request.method] || 50;
      
      if (count >= limit) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Increment rate limit counter (1 minute expiration)
      await env.RATE_LIMIT_KV.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 60 });

      // GET /api/leaderboard - Public read access
      if (path === '/api/leaderboard' && request.method === 'GET') {
        console.log('Proxying GET request to backend:', env.BACKEND_API_URL);
        
        const backendResponse = await fetch(`${env.BACKEND_API_URL}/api/leaderboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.INTERNAL_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        if (!backendResponse.ok) {
          console.error('Backend response not OK:', backendResponse.status, backendResponse.statusText);
          const errorText = await backendResponse.text();
          console.error('Backend error response:', errorText);
          throw new Error(`Backend returned ${backendResponse.status}: ${errorText}`);
        }

        const data = await backendResponse.json();
        
        return new Response(JSON.stringify(data), {
          status: backendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leaderboard - Protected write access
      if (path === '/api/leaderboard' && request.method === 'POST') {
        const body = await request.json();
        
        // Basic client-side validation (server will do real validation)
        if (!body.name || !body.score || body.score <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid score data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Forward to secure backend with internal auth
        const backendResponse = await fetch(`${env.BACKEND_API_URL}/api/leaderboard`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.INTERNAL_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Client-IP': clientIP,
            'X-Forwarded-For': request.headers.get('X-Forwarded-For') || clientIP,
          },
          body: JSON.stringify(body)
        });

        if (!backendResponse.ok) {
          console.error('Backend POST response not OK:', backendResponse.status, backendResponse.statusText);
          const errorText = await backendResponse.text();
          console.error('Backend POST error response:', errorText);
          throw new Error(`Backend returned ${backendResponse.status}: ${errorText}`);
        }

        const data = await backendResponse.json();
        
        return new Response(JSON.stringify(data), {
          status: backendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Test endpoint to check if proxy is working
      if (path === '/api/test' && request.method === 'GET') {
        return new Response(JSON.stringify({ 
          message: 'Proxy is working!', 
          backendUrl: env.BACKEND_API_URL,
          hasKey: !!env.INTERNAL_API_KEY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};