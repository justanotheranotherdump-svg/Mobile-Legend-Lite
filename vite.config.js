import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // The repository index.html is the committed offline game. During development,
  // serve the editable template instead so HMR never uses a stale built bundle.
  plugins: [{
    name: 'development-entry',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url, 'http://vite.internal');
        if (url.pathname === '/' || url.pathname === '/index.html') {
          request.url = `/dev.html${url.search}`;
        }
        next();
      });
    },
  }],
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'] },
  build: {
    target: 'es2022',
    assetsInlineLimit: 100000000,
    modulePreload: false,
    sourcemap: false,
    rollupOptions: { input: 'dev.html', output: { inlineDynamicImports: true } },
  },
});
