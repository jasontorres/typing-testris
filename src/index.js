// Cloudflare Workers API for Global Leaderboard
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    try {
      // GET /api/leaderboard - Get global leaderboard
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        return new Response(JSON.stringify(leaderboard), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // POST /api/leaderboard - Submit new score
      if (path === '/api/leaderboard' && request.method === 'POST') {
        const scoreData = await request.json();
        
        // Validate score data
        if (!scoreData.name || !scoreData.score || scoreData.score <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid score data' }), {
            status: 400,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        // Sanitize and prepare score entry
        const scoreEntry = {
          name: scoreData.name.slice(0, 20), // Limit name length
          score: Math.floor(scoreData.score),
          level: Math.floor(scoreData.level || 1),
          sentences: Math.floor(scoreData.sentences || 0),
          date: new Date().toISOString(),
          timestamp: Date.now()
        };

        // Get current leaderboard
        let leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        
        // Add new score and sort
        leaderboard.push(scoreEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        leaderboard = leaderboard.slice(0, 100);
        
        // Save updated leaderboard
        await env.LEADERBOARD_KV.put('global_leaderboard', JSON.stringify(leaderboard));
        
        // Return rank and updated leaderboard
        const rank = leaderboard.findIndex(entry => entry.timestamp === scoreEntry.timestamp) + 1;
        
        return new Response(JSON.stringify({ 
          rank, 
          leaderboard: leaderboard.slice(0, 20) // Return top 20 for display
        }), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // GET /api/leaderboard/stats - Get leaderboard statistics
      if (path === '/api/leaderboard/stats' && request.method === 'GET') {
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
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // 404 for unknown routes
      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  },
};