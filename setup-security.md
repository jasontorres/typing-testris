# Security Implementation Guide

## 🔒 Security Features Added

### **1. API Key Protection**
- Score submissions require an `X-API-Key` header
- Admin operations require an `X-Admin-Key` header
- Keys are stored as Cloudflare secrets (not in code)

### **2. Rate Limiting**
- GET requests: 100 per minute per IP
- POST requests: 10 per minute per IP
- Prevents spam and DoS attacks

### **3. Input Validation & Sanitization**
- Score validation (reasonable ranges)
- Name sanitization (remove HTML/scripts)
- Game session verification

### **4. Anti-Cheat Measures**
- Game session tracking (prevents impossible scores)
- Duplicate score detection
- Time-based score validation
- IP-based duplicate prevention

### **5. Access Control**
- CORS restricted to your domain only
- Admin endpoints protected
- Request logging for monitoring

## 🛠️ Setup Instructions

### **Step 1: Set API Secrets**
```bash
# Generate secure random keys
openssl rand -hex 32  # Use this for API_SECRET
openssl rand -hex 32  # Use this for ADMIN_SECRET

# Set the secrets in Cloudflare
npx wrangler secret put API_SECRET
npx wrangler secret put ADMIN_SECRET
```

### **Step 2: Deploy Secure Version**
```bash
# Deploy with secure configuration
npx wrangler deploy --config wrangler-secure.toml
```

### **Step 3: Update Frontend**
Replace `global-leaderboard.js` with `secure-global-leaderboard.js` in your HTML:
```html
<script src="secure-global-leaderboard.js"></script>
```

### **Step 4: Set API Key in Frontend**
Update the API key in `secure-global-leaderboard.js`:
```javascript
this.apiKey = 'your-actual-api-key-here';
```

### **Step 5: Rebuild and Deploy**
```bash
npm run build
npx wrangler pages deploy dist
```

## 🎯 Security Levels

### **Level 1: Basic (Current)**
- Open API, anyone can submit scores
- Minimal validation
- No rate limiting

### **Level 2: Protected (Recommended)**
- API key required for submissions
- Rate limiting enabled
- Input validation and sanitization
- Game session verification

### **Level 3: Enterprise**
- User authentication (JWT tokens)
- Server-side game validation
- Real-time cheat detection
- Advanced monitoring and alerts

## 🔍 Monitoring

### **Check Rate Limiting**
```bash
# View rate limit data
npx wrangler kv key list --namespace-id="aa766996999b4e368d80eaaf2b2e0a72" --prefix="rate_limit:"
```

### **View Logs**
```bash
# Monitor API usage
npx wrangler tail
```

### **Check Recent Submissions**
```bash
# View recent score logs
npx wrangler kv key list --namespace-id="aa766996999b4e368d80eaaf2b2e0a72" --prefix="log:"
```

## ⚠️ Security Considerations

### **API Key Exposure**
- The API key is visible in frontend code
- For maximum security, use server-side proxy
- Consider implementing JWT authentication

### **Client-Side Validation**
- All validation happens on the server
- Client-side checks are just for user experience
- Never trust client-side data

### **Rate Limiting**
- Adjust limits based on your usage patterns
- Monitor for abuse and adjust as needed
- Consider implementing progressive penalties

## 🚀 Advanced Security Options

### **Option A: Server-Side Proxy**
Create a backend service that:
- Authenticates users
- Validates game data server-side
- Proxies requests to Cloudflare Workers
- Keeps API keys secret

### **Option B: JWT Authentication**
- Implement user registration/login
- Issue JWT tokens for authenticated users
- Validate tokens server-side
- Associate scores with user accounts

### **Option C: Game Integrity Verification**
- Send game events throughout gameplay
- Verify score calculation server-side
- Detect impossible game states
- Flag suspicious patterns

Choose the level of security that matches your needs and user base.