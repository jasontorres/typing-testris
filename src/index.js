// SECURE Backend Worker - Contains real secrets and business logic
// This should ONLY be called by the proxy worker, never directly by frontend

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Security check - only allow requests with valid internal auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - missing auth' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    if (token !== env.INTERNAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get client IP from proxy
    const clientIP = request.headers.get('X-Client-IP') || 'unknown';

    try {
      // GET /api/leaderboard - Get global leaderboard
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        return new Response(JSON.stringify(leaderboard), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leaderboard - Submit new score
      if (path === '/api/leaderboard' && request.method === 'POST') {
        const scoreData = await request.json();
        
        // Validate score data
        if (!scoreData.name || !scoreData.score || scoreData.score <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid score data' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Enhanced validation for backend
        if (scoreData.score > 1000000) {
          return new Response(JSON.stringify({ error: 'Score too high - possible cheat detected' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check for duplicate submissions from same IP
        const duplicateKey = `recent_score:${clientIP}:${scoreData.score}`;
        const recentSubmission = await env.LEADERBOARD_KV.get(duplicateKey);
        if (recentSubmission) {
          return new Response(JSON.stringify({ error: 'Duplicate score detected' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Sanitize and prepare score entry
        const scoreEntry = {
          name: scoreData.name.slice(0, 20).replace(/[<>]/g, ''), // Remove HTML chars
          score: Math.floor(Math.abs(scoreData.score)),
          level: Math.floor(Math.abs(scoreData.level || 1)),
          sentences: Math.floor(Math.abs(scoreData.sentences || 0)),
          date: new Date().toISOString(),
          timestamp: Date.now(),
          clientIP: clientIP.slice(0, 15) // Store partial IP for debugging
        };

        // Mark this score as submitted to prevent duplicates
        await env.LEADERBOARD_KV.put(duplicateKey, 'true', { expirationTtl: 300 }); // 5 minutes

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
          headers: { 'Content-Type': 'application/json' }
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
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Backend Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};