class SecureGlobalLeaderboard {
    constructor() {
        this.apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'https://typing-testris.chilang.workers.dev' 
            : 'https://typing-testris.chilang.workers.dev';
        
        // Generate a game session when the game starts
        this.gameSession = this.createGameSession();
        
        // API key (in production, this would be environment-specific)
        this.apiKey = 'your-api-key-here'; // This should be set via build process
        
        this.isOnline = navigator.onLine;
        this.cache = null;
        this.lastFetch = 0;
        this.cacheTimeout = 30000;

        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingScores();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    createGameSession() {
        const sessionData = {
            startTime: Date.now(),
            sessionId: Math.random().toString(36).slice(2),
            version: '1.0'
        };
        
        // Simple base64 encoding (not secure, but prevents casual tampering)
        return btoa(JSON.stringify(sessionData));
    }

    async getLeaderboard() {
        if (!this.isOnline) {
            return this.getOfflineLeaderboard();
        }

        try {
            const now = Date.now();
            if (this.cache && (now - this.lastFetch) < this.cacheTimeout) {
                return this.cache;
            }

            const response = await fetch(`${this.apiBase}/api/leaderboard`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const leaderboard = await response.json();
            this.cache = leaderboard;
            this.lastFetch = now;
            this.storeOfflineLeaderboard(leaderboard);
            
            return leaderboard;
        } catch (error) {
            console.warn('Failed to fetch global leaderboard:', error);
            return this.getOfflineLeaderboard();
        }
    }

    async submitScore(scoreData) {
        if (!this.isOnline) {
            this.storePendingScore(scoreData);
            return { rank: null, offline: true };
        }

        try {
            // Validate score client-side first
            if (!this.validateScore(scoreData)) {
                throw new Error('Invalid score data');
            }

            const response = await fetch(`${this.apiBase}/api/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                    'X-Game-Session': this.gameSession,
                },
                body: JSON.stringify(scoreData)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before submitting again.');
                } else if (response.status === 401) {
                    throw new Error('Authentication failed. Please refresh the page.');
                } else if (response.status === 403) {
                    throw new Error('Invalid game session. Please refresh the page.');
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (result.leaderboard) {
                this.cache = result.leaderboard;
                this.lastFetch = Date.now();
                this.storeOfflineLeaderboard(result.leaderboard);
            }
            
            return result;
        } catch (error) {
            console.warn('Failed to submit score to global leaderboard:', error);
            this.storePendingScore(scoreData);
            return { rank: null, offline: true, error: error.message };
        }
    }

    validateScore(scoreData) {
        // Client-side validation to prevent obviously invalid submissions
        if (!scoreData.name || scoreData.name.length > 20) return false;
        if (!scoreData.score || scoreData.score <= 0 || scoreData.score > 1000000) return false;
        if (scoreData.level && (scoreData.level < 1 || scoreData.level > 100)) return false;
        
        // Check if score is reasonable for game time
        const gameTime = Date.now() - JSON.parse(atob(this.gameSession)).startTime;
        const maxReasonableScore = (gameTime / 60000) * 500; // 500 points per minute max
        
        if (scoreData.score > maxReasonableScore * 3) {
            console.warn('Score appears too high for game duration');
            return false;
        }
        
        return true;
    }

    // Existing offline support methods...
    getOfflineLeaderboard() {
        try {
            const stored = localStorage.getItem('global-leaderboard-cache');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    storeOfflineLeaderboard(leaderboard) {
        try {
            localStorage.setItem('global-leaderboard-cache', JSON.stringify(leaderboard));
        } catch (e) {
            console.warn('Failed to store offline leaderboard cache');
        }
    }

    storePendingScore(scoreData) {
        try {
            const pending = this.getPendingScores();
            pending.push({
                ...scoreData,
                pendingTimestamp: Date.now(),
                gameSession: this.gameSession
            });
            localStorage.setItem('pending-global-scores', JSON.stringify(pending));
        } catch (e) {
            console.warn('Failed to store pending score');
        }
    }

    getPendingScores() {
        try {
            const stored = localStorage.getItem('pending-global-scores');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    async syncPendingScores() {
        const pending = this.getPendingScores();
        if (pending.length === 0) return;

        console.log(`Syncing ${pending.length} pending scores...`);
        
        const synced = [];
        for (const scoreData of pending) {
            try {
                const { pendingTimestamp, gameSession, ...cleanScoreData } = scoreData;
                
                // Use the original game session for pending scores
                const originalGameSession = this.gameSession;
                this.gameSession = gameSession;
                
                const result = await this.submitScore(cleanScoreData);
                
                // Restore current game session
                this.gameSession = originalGameSession;
                
                if (!result.offline) {
                    synced.push(scoreData);
                }
            } catch (error) {
                console.warn('Failed to sync pending score:', error);
                break; // Stop on first failure to avoid overwhelming the API
            }
        }

        // Remove successfully synced scores
        if (synced.length > 0) {
            const remaining = pending.filter(score => !synced.includes(score));
            localStorage.setItem('pending-global-scores', JSON.stringify(remaining));
            console.log(`Synced ${synced.length} scores successfully`);
        }
    }

    hasPendingScores() {
        return this.getPendingScores().length > 0;
    }

    // Reset game session (call when starting a new game)
    resetGameSession() {
        this.gameSession = this.createGameSession();
    }
}

// Create global instance
window.secureGlobalLeaderboard = new SecureGlobalLeaderboard();