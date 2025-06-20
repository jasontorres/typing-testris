// Simple Secure API - Single Worker with Hidden Implementation
// This approach hides the logic while keeping API keys server-side only

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // CORS headers - allow your domain
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://979f7cb6.typing-testris-97z.pages.dev',
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token',
    };

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Rate limiting
      const rateLimitKey = `rate_limit:${clientIP}:${request.method}:${path}`;
      const currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
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
      
      // Increment rate limit counter
      await env.RATE_LIMIT_KV.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 60 });

      // GET /api/leaderboard - Public read access
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        return new Response(JSON.stringify(leaderboard), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leaderboard - Protected write access
      if (path === '/api/leaderboard' && request.method === 'POST') {
        const body = await request.json();
        
        // Simple validation
        if (!body.name || !body.score || body.score <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid score data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Anti-cheat: reasonable score validation
        if (body.score > 1000000) {
          return new Response(JSON.stringify({ error: 'Score too high - suspicious activity detected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check for duplicate submissions
        const duplicateKey = `recent_score:${clientIP}:${body.score}`;
        const recentSubmission = await env.RATE_LIMIT_KV.get(duplicateKey);
        if (recentSubmission) {
          return new Response(JSON.stringify({ error: 'Duplicate score detected - please wait before submitting again' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Sanitize and prepare score entry
        const scoreEntry = {
          name: body.name.slice(0, 20).replace(/[<>]/g, ''), // Remove HTML chars
          score: Math.floor(Math.abs(body.score)),
          level: Math.floor(Math.abs(body.level || 1)),
          sentences: Math.floor(Math.abs(body.sentences || 0)),
          date: new Date().toISOString(),
          timestamp: Date.now(),
          verified: true
        };

        // Mark this score as submitted (prevent duplicates for 5 minutes)
        await env.RATE_LIMIT_KV.put(duplicateKey, 'true', { expirationTtl: 300 });

        // Get current leaderboard
        let leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        
        // Add new score and sort
        leaderboard.push(scoreEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        leaderboard = leaderboard.slice(0, 100);
        
        // Save updated leaderboard
        await env.LEADERBOARD_KV.put('global_leaderboard', JSON.stringify(leaderboard));
        
        const rank = leaderboard.findIndex(entry => entry.timestamp === scoreEntry.timestamp) + 1;
        
        return new Response(JSON.stringify({ 
          rank, 
          leaderboard: leaderboard.slice(0, 20), // Return top 20 for display
          message: 'Score submitted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Admin endpoint - requires secret header (for clearing leaderboard)
      if (path === '/api/admin/clear' && request.method === 'POST') {
        const adminToken = request.headers.get('X-Admin-Token');
        if (!adminToken || adminToken !== env.ADMIN_SECRET) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await env.LEADERBOARD_KV.put('global_leaderboard', JSON.stringify([]));
        return new Response(JSON.stringify({ message: 'Leaderboard cleared' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/stats - Public statistics
      if (path === '/api/stats' && request.method === 'GET') {
        const leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        
        const stats = {
          totalPlayers: leaderboard.length,
          highestScore: leaderboard.length > 0 ? leaderboard[0].score : 0,
          averageScore: leaderboard.length > 0 
            ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length)
            : 0,
          lastUpdated: leaderboard.length > 0 ? leaderboard[0].date : null
        };

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('API error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};