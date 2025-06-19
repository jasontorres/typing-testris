// This is a placeholder worker script for Cloudflare Workers
// Since we're deploying a static site, this might not be needed
// but it's here in case you want to add server-side functionality later

export default {
  async fetch(request, env, ctx) {
    // For static sites, this won't be used
    // But you could add API endpoints here if needed
    return new Response('Hello from Typing Testris!');
  },
};