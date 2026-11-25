import type { Request, Response } from 'express';
import { hashPassword, memoryDb, toPublicUser } from '../../db/memoryDb.ts';
import { InvalidCepError, lookupWeatherByCep } from '../../services/weatherServer.ts';
import type { AuthResponse, ErrorResponse } from '../../types.ts';
import { signSessionToken } from '../auth.ts';

const DEFAULT_DOG_PHOTO = '/src/assets/images/corgi_avatar_biscoito_1795046208844.jpg';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeDogPhoto(rawPhoto: unknown): string {
  if (typeof rawPhoto !== 'string') return DEFAULT_DOG_PHOTO;
  const trimmed = rawPhoto.trim();
  if (!trimmed) return DEFAULT_DOG_PHOTO;
  if (/^\/src\/assets\/images\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return trimmed;
  }
  if (
    trimmed.length <= 1_500_000 &&
    /^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  return DEFAULT_DOG_PHOTO;
}

/**
 * POST /api/cadastro
 * Cadastra um novo tutor, seu cachorro e valida o CEP para consulta climática.
 */
export async function cadastroController(
  req: Request,
  res: Response<AuthResponse | ErrorResponse>,
): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const tutorName = typeof body.tutorName === 'string' ? body.tutorName.trim() : '';
  const login = typeof body.login === 'string' ? body.login.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const dogName = typeof body.dogName === 'string' ? body.dogName.trim() : '';
  const cep = typeof body.cep === 'string' ? body.cep.trim() : '';
  const dogPhoto = sanitizeDogPhoto(body.dogPhoto);

  if (!tutorName || !login || !password || !dogName || !cep) {
    res.status(400).json({
      error:
        'Preencha todos os campos obrigatórios: tutorName, login, password, dogName e cep.',
    });
    return;
  }

  if (!EMAIL_REGEX.test(login)) {
    res.status(400).json({ error: 'Informe um e-mail válido para o login.' });
    return;
  }

  if (password.length < 4 || password.length > 128) {
    res.status(400).json({ error: 'A senha deve ter entre 4 e 128 caracteres.' });
    return;
  }

  const existing = memoryDb.users.findOne({ login });
  if (existing) {
    res.status(409).json({ error: 'Este login já está em uso.' });
    return;
  }

  try {
    const weather = await lookupWeatherByCep(cep);
    const inserted = memoryDb.users.insertOne({
      login,
      tutorName,
      passwordHash: hashPassword(password),
      dogName,
      dogPhoto,
      cep: weather.cep,
      role: 'client',
      createdAt: new Date().toISOString(),
    });

    const publicUser = toPublicUser(inserted);
    const token = signSessionToken(publicUser._id);
    res.status(201).json({
      token,
      user: publicUser,
      weather,
    });
  } catch (err) {
    if (err instanceof InvalidCepError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao cadastrar tutor e pet.' });
  }
}
