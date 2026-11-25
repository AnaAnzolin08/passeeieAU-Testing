import { Router, type Request, type Response } from 'express';
import { memoryDb, toPublicUser } from '../db/memoryDb.ts';
import { InvalidCepError, lookupWeatherByCep } from '../services/weatherServer.ts';
import { requireAuth } from './auth.ts';
import { cadastroController } from './controllers/cadastroController.ts';
import {
  finishPasseioController,
  listFinalizacaoController,
} from './controllers/finalizacaoController.ts';
import { loginController } from './controllers/loginController.ts';
import { startPasseioController } from './controllers/passeioController.ts';

/**
 * Router oficial da API REST conforme especificação OpenAPI 3.0.3 (swagger.yaml).
 * Contém exclusivamente as 4 funcionalidades da plataforma:
 * Login, Cadastro, Passeio e Finalização.
 */
export function createSwaggerApiRouter(): Router {
  const router = Router();

  // Tag: Login
  router.post('/login', loginController);

  // Tag: Cadastro
  router.post('/cadastro', cadastroController);

  // Tag: Passeio (protegido por bearerAuth HMAC-SHA256)
  router.post('/passeio', requireAuth, startPasseioController);

  // Tag: Finalização (protegido por bearerAuth HMAC-SHA256)
  router.post('/finalizacao', requireAuth, finishPasseioController);
  router.get('/finalizacao', requireAuth, listFinalizacaoController);

  return router;
}

/**
 * Rotas auxiliares de suporte à interface web (catálogo de vitrine e prévia climática por CEP).
 */
export function createAppSupportRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: memoryDb.getInfo(),
    });
  });

  router.get('/produtos', (_req: Request, res: Response) => {
    res.json(memoryDb.products.find());
  });

  router.get('/usuarios', (_req: Request, res: Response) => {
    const users = memoryDb.users.find().map(toPublicUser);
    res.json(users);
  });

  router.get('/clima/:cep', async (req: Request, res: Response) => {
    const cepParam = typeof req.params.cep === 'string' ? req.params.cep : '';
    try {
      const report = await lookupWeatherByCep(cepParam);
      res.json(report);
    } catch (err) {
      if (err instanceof InvalidCepError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: 'Não foi possível consultar a previsão para este CEP.' });
    }
  });

  return router;
}
