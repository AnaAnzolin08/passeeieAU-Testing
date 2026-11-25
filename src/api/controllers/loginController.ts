import type { Request, Response } from 'express';
import { memoryDb, toPublicUser, verifyPassword } from '../../db/memoryDb.ts';
import { lookupWeatherByCep } from '../../services/weatherServer.ts';
import type { AuthResponse, ErrorResponse } from '../../types.ts';
import { signSessionToken } from '../auth.ts';

/**
 * POST /api/login
 * Autentica o tutor e retorna o diagnóstico climático automático do CEP cadastrado.
 */
export async function loginController(
  req: Request,
  res: Response<AuthResponse | ErrorResponse>,
): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const login = typeof body.login === 'string' ? body.login.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!login || !password) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  const user = memoryDb.users.findOne({ login });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Login ou senha incorretos.' });
    return;
  }

  try {
    const weather = await lookupWeatherByCep(user.cep);
    const publicUser = toPublicUser(user);
    const token = signSessionToken(publicUser._id);
    res.status(200).json({
      token,
      user: publicUser,
      weather,
    });
  } catch {
    res.status(502).json({ error: 'Falha ao consultar clima do CEP após login.' });
  }
}
