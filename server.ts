import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp } from './src/api/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET') {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`PasseieAu API rodando em http://localhost:${port}`);
    console.log(`Documentação Swagger disponível em http://localhost:${port}/docs`);
  });
}

startServer().catch((err) => {
  console.error('Erro fatal ao iniciar servidor PasseieAu:', err);
  process.exit(1);
});
