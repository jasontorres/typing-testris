# Deployment Guide - Typing Testris

This guide explains how to deploy Typing Testris to Cloudflare Workers/Pages.

## Prerequisites

- Node.js and npm installed
- Cloudflare account
- Wrangler CLI installed globally

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
   This will open a browser window to authenticate with your Cloudflare account.

## Build Process

The build process copies all static files to the `dist/` directory:

```bash
npm run build
```

This runs:
- `npm run clean` - Removes old dist folder and creates new one
- `npm run copy` - Copies HTML, CSS, and JS files to dist/

## Deployment Options

### Option 1: Cloudflare Pages (Recommended for Static Sites)

Deploy directly using Wrangler:

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging
```

### Option 2: Manual Pages Deployment

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages"
3. Click "Create a project"
4. Choose "Upload assets"
5. Upload the contents of the `dist/` folder
6. Set project name: `typing-testris`

### Option 3: Git Integration

1. Push your code to a GitHub repository
2. In Cloudflare Pages, choose "Connect to Git"
3. Select your repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

## Configuration

### Wrangler Configuration (`wrangler.toml`)

```toml
name = "typing-testris"
compatibility_date = "2023-12-01"
pages_build_output_dir = "dist"
```

### Build Scripts (`package.json`)

- `npm run build` - Build for production
- `npm run deploy` - Deploy to Cloudflare Pages
- `npm run deploy:staging` - Deploy to staging environment

## Environment Variables

No environment variables are required for the basic game deployment.

## Custom Domain

After deployment, you can:

1. Go to your Cloudflare Pages project
2. Navigate to "Custom domains"
3. Add your custom domain
4. Follow the DNS setup instructions

## Troubleshooting

### Common Issues

1. **Authentication Error**:
   ```bash
   wrangler logout
   wrangler login
   ```

2. **Build Fails**:
   - Check that all files exist in the root directory
   - Ensure Node.js is properly installed

3. **Deployment Fails**:
   - Verify you're logged into Cloudflare
   - Check your account has Pages enabled
   - Ensure project name is unique

### Useful Commands

```bash
# Check Wrangler version
wrangler --version

# List your deployments
wrangler pages project list

# View deployment logs
wrangler pages deployment list --project-name=typing-testris

# Test build locally
npm run build && python3 -m http.server 8000 --directory dist
```

## File Structure

```
typing-testris/
├── dist/           # Built files (generated)
├── src/            # Source worker files (optional)
├── config.js       # Game configuration
├── game.js         # Game logic
├── index.html      # Main HTML file
├── style.css       # Stylesheet
├── wrangler.toml   # Cloudflare configuration
└── package.json    # Node.js dependencies and scripts
```

## Performance Optimization

The game is already optimized for Cloudflare's edge network:

- Static files are served from CDN
- No server-side processing required
- Minimal dependencies
- Optimized for fast loading

## Next Steps

After deployment, you can:

1. Set up analytics with Cloudflare Web Analytics
2. Add a custom domain
3. Set up staging/production environments
4. Monitor performance metrics
5. Add server-side features using Cloudflare Workers if needed

## Support

For deployment issues:
- Check [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- Review [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)