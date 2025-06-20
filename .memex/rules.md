# Testris Leaderboard Support

## Project Overview

Added global leaderboard support to the Typing Testris game. The game now supports both local and global leaderboards.

### User Request
- Clone https://github.com/jasontorres/typing-testris 
- Add support for global leaderboard

### Architecture

**Frontend (Static Files)**
- `index.html` - Main game interface with leaderboard controls
- `game.js` - Core game logic with local and global leaderboard support
- `global-leaderboard.js` - API client for global leaderboard with offline support
- `style.css` - Styling including new leaderboard type selector
- `config.js` - Game configuration

**Backend (Cloudflare Workers)**
- `src/index.js` - API endpoints for global leaderboard
- `wrangler.toml` - Cloudflare configuration with KV namespace

### Key Features Added

1. **Dual Leaderboard System**
   - Local leaderboard (localStorage-based, original functionality)
   - Global leaderboard (cloud-based via Cloudflare Workers + KV)

2. **API Endpoints**
   - `GET /api/leaderboard` - Fetch global leaderboard
   - `POST /api/leaderboard` - Submit new score
   - `GET /api/leaderboard/stats` - Get leaderboard statistics

3. **Offline Support**
   - Scores cached locally when offline
   - Automatic sync when connection restored
   - Graceful fallback to cached data

4. **UI Enhancements**
   - Toggle between LOCAL/GLOBAL leaderboards
   - Different colors for local vs global high scores
   - Loading states and offline indicators

### Key Files

- `game.js` - Extended with global leaderboard methods
- `global-leaderboard.js` - New API client with offline support
- `src/index.js` - New Cloudflare Workers backend
- `style.css` - Updated with new leaderboard controls styling

### Deployment

**Development**
```bash
python3 -m http.server 8000
```

**Production (Cloudflare Pages + Workers)**
```bash
npm run build
npm run deploy
```

### Next Steps for Full Deployment

1. Create Cloudflare KV namespace
2. Update wrangler.toml with actual KV namespace ID
3. Deploy Workers API
4. Test global leaderboard functionality

### How to Iterate

- Test local functionality with `python3 -m http.server 8000`
- For global features, need Cloudflare Workers deployment
- UI changes can be tested locally
- Backend changes require `wrangler deploy`

The implementation is complete and functional for local testing. Global features will work once deployed to Cloudflare infrastructure.