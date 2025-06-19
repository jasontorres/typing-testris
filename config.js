// Game Configuration
// You can modify these values to customize the game behavior

const GAME_CONFIG = {
    // Level Progression Settings
    DEFAULT_SENTENCES_PER_LEVEL: 5,
    MIN_SENTENCES_PER_LEVEL: 1,
    MAX_SENTENCES_PER_LEVEL: 20,
    
    // Speed Settings
    DEFAULT_INITIAL_SPEED: 1.0,
    MIN_INITIAL_SPEED: 0.5,
    MAX_INITIAL_SPEED: 5.0,
    DEFAULT_SPEED_INCREASE: 0.3,
    MIN_SPEED_INCREASE: 0.1,
    MAX_SPEED_INCREASE: 1.0,
    
    // Timing Settings
    INITIAL_SPAWN_INTERVAL: 3000, // milliseconds
    MIN_SPAWN_INTERVAL: 1500,     // minimum spawn interval
    SPAWN_INTERVAL_DECREASE: 100,  // decrease per level
    
    // Visual Settings
    DANGER_ZONE_HEIGHT: 150,      // pixels from bottom
    SENTENCE_PADDING: 10,         // padding around sentence boxes
    SENTENCE_HEIGHT: 30,          // height of sentence boxes
    
    // Scoring Settings
    HEIGHT_BONUS_MULTIPLIER: 0.1, // points per pixel height remaining
    SPEED_BONUS_MULTIPLIER: 50,   // points per speed level
    LENGTH_BONUS_MULTIPLIER: 1,   // points per character
    
    // Canvas Settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 700,
    
    // Colors (retro theme)
    COLORS: {
        BACKGROUND: '#000000',
        PRIMARY: '#00ff00',      // main green
        SECONDARY: '#00ffff',    // cyan highlight
        WARNING: '#ffff00',      // yellow warning
        DANGER: '#ff0040',       // red danger
        COMPLETE: '#ffffff',     // white for completed text
        GRID: 'rgba(0, 255, 0, 0.1)' // grid overlay
    },
    
    // Font Settings
    FONT_FAMILY: 'Orbitron, monospace',
    FONT_SIZE: 16,
    TITLE_FONT_SIZE: '2.5rem',
    
    // Effects Settings
    NEON_GLOW_INTENSITY: 20,     // pixels
    COMPLETION_FLASH_DURATION: 100, // milliseconds
    LEVEL_UP_EFFECT_DURATION: 500,  // milliseconds
    
    // Gameplay Mechanics
    SENTENCE_MIN_SPEED: 0.5,
    SENTENCE_MAX_SPEED: 1.0,
    SENTENCE_SPAWN_X_MARGIN: 50,  // minimum distance from edges
    
    // Advanced Settings
    ENABLE_GRID_BACKGROUND: true,
    ENABLE_PARTICLE_EFFECTS: true,
    ENABLE_SOUND_EFFECTS: false,  // for future implementation
    ENABLE_POWER_UPS: false,      // for future implementation
    
    // Mobile/Responsive Settings
    MOBILE_BREAKPOINT: 768,       // pixels
    MOBILE_FONT_SCALE: 0.8,
    
    // Performance Settings
    TARGET_FPS: 60,
    ENABLE_DEBUG_MODE: false,
    
    // Custom Sentence Categories - Shorter sentences for better gameplay
    SENTENCE_CATEGORIES: {
        PANGRAMS: [
            "Quick brown fox jumps",
            "Pack my box with jugs",
            "Zebras jump quickly",
            "Bright vixens jump",
            "Black quartz sphinx",
            "Five boxing wizards",
            "Jackdaws love quartz",
            "Waltz bad nymph"
        ],
        PROGRAMMING: [
            "Code never lies",
            "First solve the problem",
            "Make it work fast",
            "Debug your code",
            "Write clean code",
            "Test your functions",
            "Refactor often",
            "Think before coding"
        ],
        QUOTES: [
            "Less is more",
            "Keep it simple",
            "Practice makes perfect",
            "Never stop learning",
            "Code with purpose",
            "Build great things",
            "Stay curious always",
            "Dream big code bigger"
        ],
        EASY: [
            "Hello world",
            "Type fast",
            "Good job",
            "Keep going",
            "You can do it",
            "Almost there",
            "Nice work",
            "Well done"
        ],
        WORDS: [
            "javascript",
            "programming",
            "computer",
            "keyboard",
            "function",
            "variable",
            "algorithm",
            "database"
        ]
    },
    
    // Difficulty Presets
    DIFFICULTY_PRESETS: {
        EASY: {
            sentencesPerLevel: 3,
            initialSpeed: 0.7,
            speedIncrease: 0.2,
            spawnInterval: 4000
        },
        NORMAL: {
            sentencesPerLevel: 5,
            initialSpeed: 1.0,
            speedIncrease: 0.3,
            spawnInterval: 3000
        },
        HARD: {
            sentencesPerLevel: 7,
            initialSpeed: 1.3,
            speedIncrease: 0.4,
            spawnInterval: 2500
        },
        INSANE: {
            sentencesPerLevel: 10,
            initialSpeed: 1.8,
            speedIncrease: 0.6,
            spawnInterval: 2000
        }
    }
};

// Export for use in main game file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}