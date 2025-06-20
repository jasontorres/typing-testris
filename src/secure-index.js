// Secure Cloudflare Workers API for Global Leaderboard
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // CORS headers - restrict to specific domains in production
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://979f7cb6.typing-testris-97z.pages.dev' 
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Game-Session',
    };

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(env, clientIP, path, request.method);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/leaderboard - Get global leaderboard (public)
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        return new Response(JSON.stringify(leaderboard), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leaderboard - Submit new score (protected)
      if (path === '/api/leaderboard' && request.method === 'POST') {
        // Verify API key (simple protection)
        const apiKey = request.headers.get('X-API-Key');
        if (!apiKey || apiKey !== env.API_SECRET) {
          return new Response(JSON.stringify({ error: 'Invalid API key' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const scoreData = await request.json();
        
        // Enhanced validation
        const validationResult = validateScoreData(scoreData);
        if (!validationResult.valid) {
          return new Response(JSON.stringify({ error: validationResult.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Game session verification (anti-cheat)
        const gameSession = request.headers.get('X-Game-Session');
        const isValidSession = await verifyGameSession(env, gameSession, scoreData);
        if (!isValidSession) {
          return new Response(JSON.stringify({ error: 'Invalid game session' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Sanitize and prepare score entry
        const scoreEntry = {
          name: sanitizeName(scoreData.name),
          score: Math.floor(Math.abs(scoreData.score)),
          level: Math.floor(Math.abs(scoreData.level || 1)),
          sentences: Math.floor(Math.abs(scoreData.sentences || 0)),
          date: new Date().toISOString(),
          timestamp: Date.now(),
          ip_hash: await hashIP(clientIP), // For duplicate detection
          verified: true
        };

        // Check for duplicate submissions
        const isDuplicate = await checkDuplicateScore(env, scoreEntry);
        if (isDuplicate) {
          return new Response(JSON.stringify({ error: 'Duplicate score submission' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get current leaderboard
        let leaderboard = await env.LEADERBOARD_KV.get('global_leaderboard', 'json') || [];
        
        // Add new score and sort
        leaderboard.push(scoreEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        leaderboard = leaderboard.slice(0, 100);
        
        // Save updated leaderboard
        await env.LEADERBOARD_KV.put('global_leaderboard', JSON.stringify(leaderboard));
        
        // Log the submission
        await logScoreSubmission(env, scoreEntry, clientIP);
        
        const rank = leaderboard.findIndex(entry => entry.timestamp === scoreEntry.timestamp) + 1;
        
        return new Response(JSON.stringify({ 
          rank, 
          leaderboard: leaderboard.slice(0, 20),
          message: 'Score submitted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Admin endpoint - clear leaderboard (protected)
      if (path === '/api/admin/clear' && request.method === 'POST') {
        const adminKey = request.headers.get('X-Admin-Key');
        if (!adminKey || adminKey !== env.ADMIN_SECRET) {
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

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

// Security helper functions
async function checkRateLimit(env, clientIP, path, method) {
  const key = `rate_limit:${clientIP}:${path}:${method}`;
  const current = await env.LEADERBOARD_KV.get(key);
  const count = current ? parseInt(current) : 0;
  
  // Different limits for different endpoints
  const limits = {
    'GET:/api/leaderboard': 100, // 100 requests per minute
    'POST:/api/leaderboard': 10,  // 10 score submissions per minute
  };
  
  const limit = limits[`${method}:${path}`] || 50;
  
  if (count >= limit) {
    return { allowed: false };
  }
  
  // Increment counter with 1-minute expiration
  await env.LEADERBOARD_KV.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return { allowed: true };
}

function validateScoreData(data) {
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Invalid name' };
  }
  
  if (!data.score || typeof data.score !== 'number' || data.score <= 0) {
    return { valid: false, error: 'Invalid score' };
  }
  
  if (data.score > 1000000) { // Reasonable max score
    return { valid: false, error: 'Score too high' };
  }
  
  if (data.level && (typeof data.level !== 'number' || data.level < 1 || data.level > 100)) {
    return { valid: false, error: 'Invalid level' };
  }
  
  return { valid: true };
}

function sanitizeName(name) {
  return name
    .slice(0, 20)
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[^\w\s-_.]/g, '') // Only allow safe characters
    .trim();
}

async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'salt_string_here');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

async function checkDuplicateScore(env, scoreEntry) {
  // Check for same IP submitting same score within 5 minutes
  const key = `recent_score:${scoreEntry.ip_hash}:${scoreEntry.score}`;
  const recent = await env.LEADERBOARD_KV.get(key);
  
  if (recent) {
    return true; // Duplicate found
  }
  
  // Store this score submission for 5 minutes
  await env.LEADERBOARD_KV.put(key, 'true', { expirationTtl: 300 });
  return false;
}

async function verifyGameSession(env, gameSession, scoreData) {
  if (!gameSession) return false;
  
  // Simple session verification - in production, you'd use JWT or similar
  try {
    const sessionData = JSON.parse(atob(gameSession));
    
    // Check if session is recent (within 1 hour)
    const sessionAge = Date.now() - sessionData.startTime;
    if (sessionAge > 3600000) return false; // 1 hour
    
    // Verify score is reasonable given game duration
    const gameTimeMinutes = (Date.now() - sessionData.startTime) / 60000;
    const maxPossibleScore = gameTimeMinutes * 1000; // Rough estimate
    
    if (scoreData.score > maxPossibleScore * 2) return false; // Too high for time played
    
    return true;
  } catch {
    return false;
  }
}

async function logScoreSubmission(env, scoreEntry, clientIP) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    name: scoreEntry.name,
    score: scoreEntry.score,
    ip_hash: scoreEntry.ip_hash,
    level: scoreEntry.level
  };
  
  // Store in a separate log for monitoring
  const logKey = `log:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await env.LEADERBOARD_KV.put(logKey, JSON.stringify(logEntry), { expirationTtl: 86400 * 7 }); // 7 days
}