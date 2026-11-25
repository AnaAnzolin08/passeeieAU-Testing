import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { memoryDb, toPublicUser } from '../db/memoryDb.ts';
import type { ErrorResponse, UserPublic } from '../types.ts';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Chave de assinatura em memória caso SESSION_SECRET não esteja definida no ambiente
const SIGNING_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

export interface AuthenticatedRequest extends Request {
  authUser?: UserPublic;
}

export function signSessionToken(userId: string): string {
  const payload = {
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): { sub: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');

  const bufA = Buffer.from(providedSig, 'utf8');
  const bufB = Buffer.from(expectedSig, 'utf8');
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.sub !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return { sub: parsed.sub };
  } catch {
    return null;
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response<ErrorResponse>,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente.' });
    return;
  }

  const rawToken = authHeader.slice('Bearer '.length).trim();
  const verified = verifySessionToken(rawToken);
  if (!verified) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    return;
  }

  const user = memoryDb.users.findOne({ _id: verified.sub });
  if (!user) {
    res.status(401).json({ error: 'Usuário autenticado não encontrado.' });
    return;
  }

  req.authUser = toPublicUser(user);
  next();
}
