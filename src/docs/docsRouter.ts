import { Router } from 'express';
import fs from 'fs';
import { load as parseYaml } from 'js-yaml';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadSwaggerSpec(): {
  yamlText: string;
  document: Record<string, unknown>;
} {
  const swaggerPath = path.resolve(__dirname, '../../swagger.yaml');
  const yamlText = fs.readFileSync(swaggerPath, 'utf8');
  const document = parseYaml(yamlText) as Record<string, unknown>;
  return { yamlText, document };
}

/**
 * Router dedicado à renderização do arquivo swagger.yaml via Swagger UI.
 */
export function createDocsRouter(): Router {
  const router = Router();
  const { yamlText, document } = loadSwaggerSpec();

  router.get('/swagger.yaml', (_req, res) => {
    res.type('text/yaml; charset=utf-8').send(yamlText);
  });

  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  const uiOptions = {
    customSiteTitle: 'PasseieAu · Documentação da API (Swagger)',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  };

  router.use((req, res, next) => {
    if (req.path === '/' && !req.originalUrl.split('?')[0].endsWith('/')) {
      const [pathname, query] = req.originalUrl.split('?');
      res.redirect(301, `${pathname}/${query ? `?${query}` : ''}`);
      return;
    }
    next();
  });

  router.use('/', swaggerUi.serveFiles(document, uiOptions), swaggerUi.setup(document, uiOptions));

  return router;
}
