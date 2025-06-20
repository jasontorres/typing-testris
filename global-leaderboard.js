class GlobalLeaderboard {
    constructor() {
        // Use the secure API - NO SECRETS EXPOSED IN FRONTEND
        this.apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'https://typing-testris-secure.chilang.workers.dev' // Use secure API
            : 'https://typing-testris-secure.chilang.workers.dev';
        
        this.isOnline = navigator.onLine;
        this.cache = null;
        this.lastFetch = 0;
        this.cacheTimeout = 30000; // 30 seconds

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingScores();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Get global leaderboard
    async getLeaderboard() {
        if (!this.isOnline) {
            return this.getOfflineLeaderboard();
        }

        try {
            // Use cache if recent
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
            
            // Cache the result
            this.cache = leaderboard;
            this.lastFetch = now;
            
            // Store offline backup
            this.storeOfflineLeaderboard(leaderboard);
            
            return leaderboard;
        } catch (error) {
            console.warn('Failed to fetch global leaderboard:', error);
            return this.getOfflineLeaderboard();
        }
    }

    // Submit score to global leaderboard
    async submitScore(scoreData) {
        if (!this.isOnline) {
            this.storePendingScore(scoreData);
            return { rank: null, offline: true };
        }

        try {
            const response = await fetch(`${this.apiBase}/api/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            // Update cache with new leaderboard
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

    // Get leaderboard statistics
    async getStats() {
        if (!this.isOnline) {
            return this.getOfflineStats();
        }

        try {
            const response = await fetch(`${this.apiBase}/api/leaderboard/stats`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const stats = await response.json();
            localStorage.setItem('global-leaderboard-stats', JSON.stringify(stats));
            
            return stats;
        } catch (error) {
            console.warn('Failed to fetch leaderboard stats:', error);
            return this.getOfflineStats();
        }
    }

    // Offline support methods
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

    getOfflineStats() {
        try {
            const stored = localStorage.getItem('global-leaderboard-stats');
            return stored ? JSON.parse(stored) : {
                totalPlayers: 0,
                highestScore: 0,
                averageScore: 0,
                lastUpdated: null
            };
        } catch (e) {
            return {
                totalPlayers: 0,
                highestScore: 0,
                averageScore: 0,
                lastUpdated: null
            };
        }
    }

    storePendingScore(scoreData) {
        try {
            const pending = this.getPendingScores();
            pending.push({
                ...scoreData,
                pendingTimestamp: Date.now()
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
        
        for (const scoreData of pending) {
            const { pendingTimestamp, ...cleanScoreData } = scoreData;
            try {
                await this.submitScore(cleanScoreData);
            } catch (error) {
                console.warn('Failed to sync pending score:', error);
                // Keep the score for next sync attempt
                return;
            }
        }

        // Clear pending scores after successful sync
        localStorage.removeItem('pending-global-scores');
        console.log('All pending scores synced successfully');
    }

    // Check if we have pending scores
    hasPendingScores() {
        return this.getPendingScores().length > 0;
    }
}

// Create global instance
window.globalLeaderboard = new GlobalLeaderboard();