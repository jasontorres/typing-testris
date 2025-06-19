# Typing Testris

A retro-style speed typing game where sentences fall like Tetris blocks. Type the sentences before they hit the ground to survive!

Play here: https://typing-testris.pages.dev

## Features

- **Retro 80s Aesthetic**: Neon green colors, pixel-perfect mono fonts, and glowing effects
- **Falling Sentences**: Type shorter, more manageable sentences that fall from the top
- **Level Progression**: Speed increases after completing a configurable number of sentences
- **Danger Zone**: Visual warning when sentences get close to the ground
- **Real-time Highlighting**: See your progress as you type each sentence
- **Score System**: Points based on height remaining, speed, and sentence length
- **Leaderboard**: Local high score tracking with top 10 scores
- **Difficulty Presets**: Easy, Normal, Hard, and Insane preset configurations
- **Configurable Settings**: Customize game difficulty and progression

## How to Play

1. **Objective**: Type the falling sentences before they reach the bottom danger zone
2. **Typing**: Focus on the input field and type the sentences exactly as they appear
3. **Completion**: Press Enter or complete the sentence to destroy it
4. **Survival**: Don't let any sentence reach the ground - it's game over!
5. **Progression**: Complete sentences to increase your score and level up

## Game Settings (Configurable)

### Sentences per Level
- **Default**: 5 sentences
- **Range**: 1-20 sentences
- **Effect**: How many sentences you need to complete before leveling up

### Initial Speed
- **Default**: 1.0x
- **Range**: 0.5x - 5.0x
- **Effect**: Starting speed of falling sentences

### Speed Increase per Level
- **Default**: 0.3x
- **Range**: 0.1x - 1.0x
- **Effect**: How much faster sentences fall after each level up

## Scoring System

Your score is calculated based on:
- **Height Bonus**: Points for how high the sentence was when completed
- **Speed Bonus**: Points based on current game speed
- **Length Bonus**: Points for the length of the completed sentence

## Controls

- **Type**: Use the text input field to type falling sentences
- **Enter**: Clear input and continue typing
- **Settings**: Adjust game parameters in real-time
- **Presets**: Choose from Easy, Normal, Hard, or Insane difficulty
- **Leaderboard**: View your high scores and compete with yourself

## Technical Details

- **Pure HTML5/CSS3/JavaScript**: No external dependencies except Google Fonts
- **Canvas-based Rendering**: Smooth 60fps animation
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Settings persist across sessions

## Running the Game

### Local Development

1. **Simple method**: Open `index.html` in a modern web browser
2. **HTTP server method**:
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`

### Deployment

This game is ready for deployment to Cloudflare Workers/Pages:

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Sentence Pool

The game includes shorter, more manageable sentences:
- **Pangrams**: Short classic typing phrases like "Quick brown fox jumps"
- **Programming**: Code-related terms like "Debug your code"
- **Quotes**: Motivational phrases like "Keep it simple"
- **Easy**: Beginner-friendly words like "Hello world"
- **Words**: Single programming terms like "javascript"

All sentences are designed to be quick to type while maintaining the challenge.

## Leaderboard System

- **Local Storage**: Scores are saved locally in your browser
- **Top 10**: Only the best 10 scores are kept
- **Player Names**: Enter your name to personalize scores
- **High Score Alerts**: Get notified when you achieve a top score
- **Persistent**: Scores remain between browser sessions
- **Clearable**: Option to clear all scores if needed

## Tips for High Scores

1. **Stay Calm**: Don't panic when sentences pile up
2. **Focus on Accuracy**: Mistakes slow you down
3. **Prioritize Danger**: Type sentences in the danger zone first
4. **Start Easy**: Use the Easy preset to learn, then progress to harder difficulties
5. **Short Bursts**: The shorter sentences allow for quick completions
6. **Muscle Memory**: Practice common programming terms and short phrases
7. **Leaderboard Goals**: Aim for the top 10 to see your name in lights!

## Customization

You can easily customize the game by modifying:
- **Sentence Pool**: Add your own sentences in `game.js`
- **Colors**: Change the retro color scheme in `style.css`
- **Timing**: Adjust spawn rates and speed progression
- **Scoring**: Modify the scoring algorithm for different gameplay styles

Enjoy your retro typing adventure! 🎮✨
