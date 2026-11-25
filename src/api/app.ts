import express, { type Express } from 'express';
import { memoryDb } from '../db/memoryDb.ts';
import { createDocsRouter, loadSwaggerSpec } from '../docs/docsRouter.ts';
import { createAppSupportRouter, createSwaggerApiRouter } from './routes.ts';

/**
 * Cria a instância Express da API REST PasseieAu + documentação Swagger,
 * sem iniciar escuta de porta nem middlewares de frontend (ideal para testes com Supertest).
 */
export function createApiApp(): Express {
  memoryDb.bootstrap();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Rotas oficiais da API REST segundo swagger.yaml
  app.use('/api', createSwaggerApiRouter());

  // Rotas de suporte à interface web
  app.use('/api', createAppSupportRouter());

  // Documentação Swagger separada (/docs e /api/docs)
  const { yamlText, document } = loadSwaggerSpec();
  app.get('/api/swagger.yaml', (_req, res) => {
    res.type('text/yaml; charset=utf-8').send(yamlText);
  });
  app.get('/api/openapi.json', (_req, res) => {
    res.json(document);
  });
  app.use('/docs', createDocsRouter());
  app.use('/api/docs', createDocsRouter());

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });

  return app;
}
