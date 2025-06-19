class FallingTypingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.userInput = document.getElementById('userInput');
        
        // Game state
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.sentencesCompleted = 0;
        
        // Game settings (configurable) - use config defaults
        this.sentencesPerLevel = GAME_CONFIG.DEFAULT_SENTENCES_PER_LEVEL;
        this.initialSpeed = GAME_CONFIG.DEFAULT_INITIAL_SPEED;
        this.speedIncrease = GAME_CONFIG.DEFAULT_SPEED_INCREASE;
        this.currentSpeed = this.initialSpeed;
        
        // Falling sentences
        this.fallingSentences = [];
        this.sentenceSpawnTimer = 0;
        this.sentenceSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;
        
        // Animation
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Colors and styling - use config
        this.colors = GAME_CONFIG.COLORS;
        
        // Sentences pool - combine all categories from config
        this.sentences = [
            ...GAME_CONFIG.SENTENCE_CATEGORIES.PANGRAMS,
            ...GAME_CONFIG.SENTENCE_CATEGORIES.PROGRAMMING,
            ...GAME_CONFIG.SENTENCE_CATEGORIES.QUOTES,
            ...GAME_CONFIG.SENTENCE_CATEGORIES.EASY,
            ...GAME_CONFIG.SENTENCE_CATEGORIES.WORDS
        ];
        
        // Leaderboard system
        this.leaderboard = this.loadLeaderboard();
        
        this.initializeGame();
        this.setupEventListeners();
        this.startGame();
    }
    
    initializeGame() {
        // Set canvas background
        this.ctx.fillStyle = this.colors.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load settings from UI
        this.loadSettings();
        
        // Initialize game objects
        this.fallingSentences = [];
        this.sentenceSpawnTimer = 0;
        
        this.updateUI();
    }
    
    loadSettings() {
        this.sentencesPerLevel = parseInt(document.getElementById('sentencesPerLevel').value) || 5;
        this.initialSpeed = parseFloat(document.getElementById('initialSpeed').value) || 1;
        this.speedIncrease = parseFloat(document.getElementById('speedIncrease').value) || 0.3;
        this.currentSpeed = this.initialSpeed;
        
        // Update UI display
        document.getElementById('sentences-per-level').textContent = this.sentencesPerLevel;
    }
    
    applyDifficultyPreset(presetName) {
        if (!presetName || !GAME_CONFIG.DIFFICULTY_PRESETS[presetName]) return;
        
        const preset = GAME_CONFIG.DIFFICULTY_PRESETS[presetName];
        
        // Update settings
        document.getElementById('sentencesPerLevel').value = preset.sentencesPerLevel;
        document.getElementById('initialSpeed').value = preset.initialSpeed;
        document.getElementById('speedIncrease').value = preset.speedIncrease;
        
        // Apply settings
        this.loadSettings();
        this.sentenceSpawnInterval = preset.spawnInterval;
    }
    
    setupEventListeners() {
        // User input handling
        this.userInput.addEventListener('input', (e) => {
            this.handleUserInput(e.target.value);
        });
        
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.target.value = '';
            }
        });
        
        // Settings changes
        document.getElementById('sentencesPerLevel').addEventListener('change', () => {
            this.loadSettings();
        });
        
        document.getElementById('initialSpeed').addEventListener('change', () => {
            this.loadSettings();
        });
        
        document.getElementById('speedIncrease').addEventListener('change', () => {
            this.loadSettings();
        });
        
        // Difficulty preset handling
        document.getElementById('difficultyPreset').addEventListener('change', (e) => {
            this.applyDifficultyPreset(e.target.value);
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.gameOver) return;
        
        // Spawn new sentences
        this.sentenceSpawnTimer += this.deltaTime;
        if (this.sentenceSpawnTimer >= this.sentenceSpawnInterval) {
            this.spawnSentence();
            this.sentenceSpawnTimer = 0;
        }
        
        // Update falling sentences
        this.fallingSentences.forEach((sentence, index) => {
            sentence.y += sentence.speed * this.currentSpeed * (this.deltaTime / 16);
            
            // Check if sentence reached bottom (danger zone)
            if (sentence.y > this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT + GAME_CONFIG.SENTENCE_HEIGHT) {
                this.endGame();
            }
        });
        
        // Remove sentences that are off screen (safety)
        this.fallingSentences = this.fallingSentences.filter(sentence => 
            sentence.y < this.canvas.height + 100
        );
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern (retro effect)
        this.drawGrid();
        
        // Draw falling sentences
        this.fallingSentences.forEach(sentence => {
            this.drawSentence(sentence);
        });
        
        // Draw UI elements
        this.drawGameUI();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.GRID;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSentence(sentence) {
        this.ctx.font = `${GAME_CONFIG.FONT_SIZE}px ${GAME_CONFIG.FONT_FAMILY}`;
        this.ctx.textAlign = 'left';
        
        // Background box
        const padding = GAME_CONFIG.SENTENCE_PADDING;
        const textWidth = this.ctx.measureText(sentence.text).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = GAME_CONFIG.SENTENCE_HEIGHT;
        
        // Box color based on completion and danger
        let boxColor = 'rgba(0, 255, 0, 0.2)';
        let textColor = this.colors.PRIMARY;
        
        if (sentence.y > this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT) {
            boxColor = 'rgba(255, 0, 64, 0.3)';
            textColor = this.colors.DANGER;
        }
        
        // Draw box
        this.ctx.fillStyle = boxColor;
        this.ctx.fillRect(sentence.x - padding, sentence.y - 20, boxWidth, boxHeight);
        
        // Draw border
        this.ctx.strokeStyle = textColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(sentence.x - padding, sentence.y - 20, boxWidth, boxHeight);
        
        // Draw text with highlighting
        this.drawHighlightedText(sentence, textColor);
    }
    
    drawHighlightedText(sentence, baseColor) {
        const completedPart = sentence.text.substring(0, sentence.completed);
        const remainingPart = sentence.text.substring(sentence.completed);
        
        this.ctx.textAlign = 'left';
        this.ctx.font = `${GAME_CONFIG.FONT_SIZE}px ${GAME_CONFIG.FONT_FAMILY}`;
        
        let x = sentence.x;
        
        // Draw completed part (green/cyan)
        if (completedPart) {
            this.ctx.fillStyle = this.colors.COMPLETE;
            this.ctx.fillText(completedPart, x, sentence.y);
            x += this.ctx.measureText(completedPart).width;
        }
        
        // Draw remaining part
        if (remainingPart) {
            this.ctx.fillStyle = baseColor;
            this.ctx.fillText(remainingPart, x, sentence.y);
        }
        
        // Draw cursor/highlight for next character
        if (sentence.completed < sentence.text.length) {
            const nextChar = sentence.text[sentence.completed];
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.fillRect(x - 1, sentence.y - 18, this.ctx.measureText(nextChar).width + 2, GAME_CONFIG.SENTENCE_HEIGHT - 10);
        }
    }
    
    drawGameUI() {
        // Draw danger zone
        this.ctx.fillStyle = 'rgba(255, 0, 64, 0.1)';
        this.ctx.fillRect(0, this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT, this.canvas.width, GAME_CONFIG.DANGER_ZONE_HEIGHT);
        
        // Draw danger zone border
        this.ctx.strokeStyle = this.colors.DANGER;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw danger zone label
        this.ctx.fillStyle = this.colors.DANGER;
        this.ctx.font = `bold ${GAME_CONFIG.FONT_SIZE - 2}px ${GAME_CONFIG.FONT_FAMILY}`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DANGER ZONE', this.canvas.width / 2, this.canvas.height - GAME_CONFIG.DANGER_ZONE_HEIGHT + 20);
    }
    
    spawnSentence() {
        const sentence = {
            text: this.getRandomSentence(),
            x: Math.random() * (this.canvas.width - 400) + GAME_CONFIG.SENTENCE_SPAWN_X_MARGIN,
            y: 30,
            speed: GAME_CONFIG.SENTENCE_MIN_SPEED + Math.random() * (GAME_CONFIG.SENTENCE_MAX_SPEED - GAME_CONFIG.SENTENCE_MIN_SPEED),
            completed: 0,
            id: Date.now() + Math.random()
        };
        
        this.fallingSentences.push(sentence);
    }
    
    getRandomSentence() {
        return this.sentences[Math.floor(Math.random() * this.sentences.length)];
    }
    
    handleUserInput(input) {
        if (this.gameOver) return;
        
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        
        // Check each falling sentence
        this.fallingSentences.forEach((sentence, index) => {
            if (sentence.text.toLowerCase().startsWith(trimmedInput.toLowerCase())) {
                sentence.completed = trimmedInput.length;
                
                // Check if sentence is complete
                if (trimmedInput.toLowerCase() === sentence.text.toLowerCase()) {
                    this.completeSentence(index);
                    this.userInput.value = '';
                }
            }
        });
    }
    
    completeSentence(index) {
        const sentence = this.fallingSentences[index];
        
        // Calculate score based on remaining height
        const heightBonus = Math.max(0, Math.floor((this.canvas.height - sentence.y) / 10));
        const speedBonus = Math.floor(this.currentSpeed * 50);
        const lengthBonus = sentence.text.length;
        
        this.score += heightBonus + speedBonus + lengthBonus;
        this.sentencesCompleted++;
        
        // Remove completed sentence
        this.fallingSentences.splice(index, 1);
        
        // Check for level up
        if (this.sentencesCompleted % this.sentencesPerLevel === 0) {
            this.levelUp();
        }
        
        this.updateUI();
        
        // Spawn effect (visual feedback)
        this.createCompletionEffect(sentence.x, sentence.y);
    }
    
    createCompletionEffect(x, y) {
        // Simple particle effect could be added here
        // For now, we'll just flash the background
        const originalColor = this.canvas.style.backgroundColor;
        this.canvas.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        setTimeout(() => {
            this.canvas.style.backgroundColor = originalColor;
        }, 100);
    }
    
    levelUp() {
        this.level++;
        this.currentSpeed += this.speedIncrease;
        
        // Increase spawn rate slightly
        this.sentenceSpawnInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, this.sentenceSpawnInterval - GAME_CONFIG.SPAWN_INTERVAL_DECREASE);
        
        this.updateUI();
        
        // Visual feedback for level up
        this.showLevelUpEffect();
    }
    
    showLevelUpEffect() {
        // Flash effect for level up
        const canvas = this.canvas;
        canvas.style.boxShadow = '0 0 50px #00ffff, inset 0 0 30px rgba(0, 255, 255, 0.3)';
        setTimeout(() => {
            canvas.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)';
        }, 500);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('speed').textContent = this.currentSpeed.toFixed(1) + 'x';
        document.getElementById('sentences-completed').textContent = this.sentencesCompleted;
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOver').style.display = 'flex';
        
        // Disable input
        this.userInput.disabled = true;
        
        // Save score to leaderboard
        this.saveScore();
    }
    
    restart() {
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.sentencesCompleted = 0;
        this.fallingSentences = [];
        this.sentenceSpawnTimer = 0;
        this.sentenceSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;
        
        // Reload settings
        this.loadSettings();
        
        // Hide game over screen and clear high score messages
        document.getElementById('gameOver').style.display = 'none';
        const highScoreMsg = document.querySelector('.high-score-message');
        if (highScoreMsg) {
            highScoreMsg.remove();
        }
        
        // Enable input
        this.userInput.disabled = false;
        this.userInput.value = '';
        this.userInput.focus();
        
        // Update UI
        this.updateUI();
        
        // Restart game loop
        this.startGame();
    }
    
    // Leaderboard methods
    loadLeaderboard() {
        try {
            const stored = localStorage.getItem('falling-typing-leaderboard');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveLeaderboard() {
        try {
            localStorage.setItem('falling-typing-leaderboard', JSON.stringify(this.leaderboard));
        } catch (e) {
            console.error('Failed to save leaderboard:', e);
        }
    }
    
    saveScore() {
        if (this.score <= 0) return;
        
        const playerName = this.getPlayerName();
        const scoreEntry = {
            name: playerName,
            score: this.score,
            level: this.level,
            sentences: this.sentencesCompleted,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        const oldLength = this.leaderboard.length;
        this.leaderboard.push(scoreEntry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Check if this is a new high score
        const rank = this.leaderboard.findIndex(entry => entry.timestamp === scoreEntry.timestamp) + 1;
        if (rank <= 10) {
            this.showHighScoreMessage(rank);
        }
        
        this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
        
        this.saveLeaderboard();
        this.displayLeaderboard();
    }
    
    showHighScoreMessage(rank) {
        const gameOverContent = document.querySelector('.game-over-content');
        const highScoreMsg = document.createElement('p');
        highScoreMsg.className = 'high-score-message';
        highScoreMsg.style.color = '#FFD700';
        highScoreMsg.style.fontWeight = 'bold';
        highScoreMsg.style.textShadow = '0 0 15px #FFD700';
        
        if (rank === 1) {
            highScoreMsg.textContent = '🏆 NEW HIGH SCORE! 🏆';
        } else if (rank <= 3) {
            highScoreMsg.textContent = `🥇 Top ${rank} Score! 🥇`;
        } else {
            highScoreMsg.textContent = `⭐ Top 10 Score! Rank #${rank} ⭐`;
        }
        
        gameOverContent.insertBefore(highScoreMsg, gameOverContent.querySelector('button'));
    }
    
    getPlayerName() {
        let name = localStorage.getItem('falling-typing-player-name');
        if (!name) {
            name = prompt('Enter your name for the leaderboard:') || 'Anonymous';
            localStorage.setItem('falling-typing-player-name', name);
        }
        return name;
    }
    
    displayLeaderboard() {
        const leaderboardDiv = document.getElementById('leaderboardList');
        if (!leaderboardDiv) return;
        
        leaderboardDiv.innerHTML = '';
        
        if (this.leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<div class="no-scores">No scores yet!</div>';
            return;
        }
        
        this.leaderboard.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString();
            
            entryDiv.innerHTML = `
                <div class="rank">${index + 1}</div>
                <div class="name">${entry.name}</div>
                <div class="score">${entry.score}</div>
                <div class="level">L${entry.level}</div>
                <div class="sentences">${entry.sentences}</div>
                <div class="date">${dateStr}</div>
            `;
            
            leaderboardDiv.appendChild(entryDiv);
        });
    }
    
    clearLeaderboard() {
        if (confirm('Are you sure you want to clear the leaderboard?')) {
            this.leaderboard = [];
            this.saveLeaderboard();
            this.displayLeaderboard();
        }
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new FallingTypingGame();
    
    // Focus on input
    document.getElementById('userInput').focus();
    
    // Display initial leaderboard
    game.displayLeaderboard();
});

// Restart function for the restart button
function restartGame() {
    if (game) {
        game.restart();
    }
}

// Toggle leaderboard visibility
function toggleLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard.style.display === 'none') {
        leaderboard.style.display = 'block';
        if (game) {
            game.displayLeaderboard();
        }
    } else {
        leaderboard.style.display = 'none';
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.canvas) {
        // Maintain aspect ratio on mobile
        const container = game.canvas.parentElement;
        const containerWidth = container.clientWidth;
        if (containerWidth < 800) {
            game.canvas.style.width = '100%';
            game.canvas.style.height = 'auto';
        }
    }
});

// Prevent scrolling on mobile when typing
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });