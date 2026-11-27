import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createDocsRouter } from './src/docs/docsRouter.ts';
import { evaluateWalkSafety } from './src/services/walkSafety.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.join(os.tmpdir(), 'passeeieau-db.json');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

type CoatType = 'short' | 'double' | 'long';
type WalkPace = 'light' | 'moderate' | 'brisk';

interface StoredUser {
  id: string;
  tutorName: string;
  login: string;
  passwordHash: string;
  passwordSalt: string;
  cep: string;
  dogName: string;
  dogBreed: string;
  dogWeightKg: number;
  coatType: CoatType;
  dogPhoto: string;
  createdAt: string;
}

interface StoredWalk {
  id: string;
  userId: string;
  userLogin?: string;
  tutorName?: string;
  dogName: string;
  dogBreed: string;
  startedAt: string;
  finishedAt?: string | null;
  status?: 'in_progress' | 'completed';
  durationSec: number;
  distanceKm: number;
  caloriesKcal: number;
  pace: WalkPace;
  cep: string;
  cityLabel: string;
  temperatureC: number;
  hasRain?: boolean;
  condition: string;
  excessiveHeat: boolean;
  notes: string;
}

interface DbShape {
  users: StoredUser[];
  walks: StoredWalk[];
}

const UF_COORDS: Record<string, { lat: number; lon: number }> = {
  AC: { lat: -9.9747, lon: -67.81 },
  AL: { lat: -9.6658, lon: -35.7353 },
  AP: { lat: 0.0349, lon: -51.0694 },
  AM: { lat: -3.119, lon: -60.0217 },
  BA: { lat: -12.9714, lon: -38.5014 },
  CE: { lat: -3.7319, lon: -38.5267 },
  DF: { lat: -15.7939, lon: -47.8828 },
  ES: { lat: -20.3155, lon: -40.3128 },
  GO: { lat: -16.6869, lon: -49.2648 },
  MA: { lat: -2.5307, lon: -44.3068 },
  MT: { lat: -15.6014, lon: -56.0979 },
  MS: { lat: -20.4697, lon: -54.6201 },
  MG: { lat: -19.9167, lon: -43.9345 },
  PA: { lat: -1.4558, lon: -48.4902 },
  PB: { lat: -7.1195, lon: -34.845 },
  PR: { lat: -25.4284, lon: -49.2733 },
  PE: { lat: -8.0476, lon: -34.877 },
  PI: { lat: -5.092, lon: -42.8038 },
  RJ: { lat: -22.9068, lon: -43.1729 },
  RN: { lat: -5.7945, lon: -35.211 },
  RS: { lat: -30.0346, lon: -51.2177 },
  RO: { lat: -8.7619, lon: -63.9039 },
  RR: { lat: 2.8235, lon: -60.6758 },
  SC: { lat: -27.5954, lon: -48.548 },
  SP: { lat: -23.5505, lon: -46.6333 },
  SE: { lat: -10.9472, lon: -37.0731 },
  TO: { lat: -10.2491, lon: -48.3243 },
};

function readDb(): DbShape {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Partial<DbShape>;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        walks: Array.isArray(parsed.walks) ? parsed.walks : [],
      };
    }
  } catch {
    // ignore corrupt temp store
  }
  return { users: [], walks: [] };
}

function writeDb(db: DbShape): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function toPublicUser(user: StoredUser) {
  return {
    _id: user.id,
    id: user.id,
    tutorName: user.tutorName,
    login: user.login,
    cep: user.cep,
    dogName: user.dogName,
    dogBreed: user.dogBreed,
    dogWeightKg: user.dogWeightKg,
    coatType: user.coatType,
    dogPhoto: user.dogPhoto,
    role: 'client',
    createdAt: user.createdAt,
  };
}

function toPublicWalk(walk: StoredWalk) {
  return {
    _id: walk.id,
    userId: walk.userId,
    userLogin: walk.userLogin ?? '',
    tutorName: walk.tutorName ?? '',
    dogName: walk.dogName,
    cep: walk.cep,
    weatherSummary: walk.condition,
    temperatureC: walk.temperatureC,
    hasRain: walk.hasRain ?? false,
    excessiveHeat: walk.excessiveHeat,
    status: walk.status ?? 'completed',
    startedAt: walk.startedAt,
    finishedAt: walk.finishedAt ?? null,
    durationSeconds: walk.durationSec,
    caloriesBurned: walk.caloriesKcal,
  };
}

function summarizeWalks(walks: StoredWalk[]) {
  const completed = walks.filter((walk) => (walk.status ?? 'completed') === 'completed');
  return {
    walks: completed.map(toPublicWalk),
    totals: {
      totalWalks: completed.length,
      totalDurationSeconds: completed.reduce((total, walk) => total + walk.durationSec, 0),
      totalCaloriesBurned:
        Math.round(completed.reduce((total, walk) => total + walk.caloriesKcal, 0) * 100) / 100,
    },
  };
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHex: string): boolean {
  const actualBuf = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { uid?: string; exp?: number };
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

function isSafePhoto(url: string): boolean {
  if (url.startsWith('/src/assets/images/')) return true;
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(url);
}

function weatherCodeToPtBr(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code === 1 || code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 57) return 'Garoa';
  if (code >= 61 && code <= 67) return 'Chuva';
  if (code >= 71 && code <= 77) return 'Granizo leve';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95) return 'Tempestade';
  return 'Condição estável';
}

function isRainCode(code: number, precipitationMm: number): boolean {
  if (precipitationMm >= 0.3) return true;
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  );
}

function estimateAsphaltTemp(
  airTempC: number,
  uvIndex: number,
  isDay: boolean,
  precipitationMm: number
): number {
  if (precipitationMm >= 0.4) return Math.round((airTempC + 0.5) * 10) / 10;
  if (!isDay) return Math.round((airTempC + 1.5) * 10) / 10;
  const uvGain = Math.max(0, uvIndex) * 2.15;
  const ambientGain = airTempC > 23 ? (airTempC - 23) * 0.55 : 0;
  return Math.round((airTempC + Math.min(27, uvGain + ambientGain)) * 10) / 10;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function resolveCepLocation(cepDigits: string): Promise<{
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cityLabel: string;
  latitude: number;
  longitude: number;
}> {
  const formatted = `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`;
  let street = '';
  let neighborhood = '';
  let city = '';
  let state = '';
  let lat: number | undefined;
  let lon: number | undefined;

  try {
    const via = (await fetchJsonWithTimeout(
      `https://viacep.com.br/ws/${cepDigits}/json/`
    )) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (!via.erro && via.localidade && via.uf) {
      street = via.logradouro || '';
      neighborhood = via.bairro || '';
      city = via.localidade;
      state = via.uf;
    }
  } catch {
    // fallback below
  }

  if (!city || !state) {
    const brasil = (await fetchJsonWithTimeout(
      `https://brasilapi.com.br/api/cep/v2/${cepDigits}`
    )) as {
      street?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      location?: { coordinates?: { latitude?: string; longitude?: string } };
    };
    if (!brasil.city || !brasil.state) {
      throw new Error('CEP não encontrado.');
    }
    street = brasil.street || '';
    neighborhood = brasil.neighborhood || '';
    city = brasil.city;
    state = brasil.state;
    const latNum = Number(brasil.location?.coordinates?.latitude);
    const lonNum = Number(brasil.location?.coordinates?.longitude);
    if (Number.isFinite(latNum) && latNum !== 0) lat = latNum;
    if (Number.isFinite(lonNum) && lonNum !== 0) lon = lonNum;
  }

  if (lat === undefined || lon === undefined) {
    try {
      const geo = (await fetchJsonWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt&format=json`
      )) as {
        results?: Array<{ latitude: number; longitude: number; country_code?: string }>;
      };
      const match =
        geo.results?.find((r) => r.country_code === 'BR') || geo.results?.[0];
      if (match) {
        lat = match.latitude;
        lon = match.longitude;
      }
    } catch {
      // fallback to UF capital
    }
  }

  if (lat === undefined || lon === undefined) {
    const cap = UF_COORDS[state.toUpperCase()] || UF_COORDS.SP;
    lat = cap.lat;
    lon = cap.lon;
  }

  const cityLabel = neighborhood
    ? `${neighborhood} · ${city} - ${state}`
    : `${city} - ${state}`;

  return {
    cep: formatted,
    street,
    neighborhood,
    city,
    state,
    cityLabel,
    latitude: lat,
    longitude: lon,
  };
}

async function buildWeatherForCep(cepRaw: string, dogName: string) {
  const digits = cepRaw.replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new Error('CEP inválido.');
  }
  const loc = await resolveCepLocation(digits);
  const meteoUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index,is_day` +
    `&timezone=America/Sao_Paulo&forecast_days=1`;
  const meteo = (await fetchJsonWithTimeout(meteoUrl)) as {
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      precipitation: number;
      weather_code: number;
      wind_speed_10m: number;
      uv_index: number;
      is_day: number;
    };
  };

  const cur = meteo.current;
  const temperatureC = Math.round(cur.temperature_2m * 10) / 10;
  const apparentTempC = Math.round(cur.apparent_temperature * 10) / 10;
  const condition = weatherCodeToPtBr(cur.weather_code);
  const hasRain = isRainCode(cur.weather_code, cur.precipitation);
  const { excessiveHeat, blockedByHeat, canWalk } = evaluateWalkSafety(
    temperatureC,
    hasRain,
    cur.time,
  );
  const asphaltTempC = estimateAsphaltTemp(
    cur.temperature_2m,
    cur.uv_index,
    cur.is_day === 1,
    cur.precipitation
  );

  const rainBlockMessage = hasRain
    ? `Há previsão de chuva (${condition}) para o CEP ${loc.cep} (${loc.cityLabel}). Por segurança e conforto de ${dogName}, o início do passeio foi bloqueado.`
    : '';

  let heatWarning = '';
  if (blockedByHeat) {
    heatWarning = `Temperatura acima de 27°C entre 9h e 16h: o passeio de ${dogName} foi bloqueado preventivamente.`;
  } else if (excessiveHeat) {
    heatWarning = `Temperatura acima de 27°C fora do horário de bloqueio. Prefira locais sombreados e leve água fresca para ${dogName}.`;
  }

  return {
    cep: loc.cep,
    cityLabel: loc.cityLabel,
    temperatureC,
    apparentTempC,
    humidityPct: Math.round(cur.relative_humidity_2m),
    windSpeedKmh: Math.round(cur.wind_speed_10m * 10) / 10,
    uvIndex: Math.round(cur.uv_index * 10) / 10,
    condition,
    hasRain,
    rainBlockMessage,
    excessiveHeat,
    heatWarning,
    canWalk,
    asphaltTempC,
    hydrationIntervalMin: excessiveHeat ? 12 : 20,
    observedAt: cur.time,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/docs', createDocsRouter());
  app.use('/api/docs', createDocsRouter());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/usuarios', (_req, res) => {
    const users = readDb().users.map(toPublicUser);
    res.json(users);
  });

  app.get('/api/cep/:cep', async (req, res) => {
    try {
      const digits = req.params.cep.replace(/\D/g, '');
      if (digits.length !== 8) {
        res.status(400).json({ error: 'CEP deve conter 8 dígitos.' });
        return;
      }
      const loc = await resolveCepLocation(digits);
      res.json({
        cep: loc.cep,
        cityLabel: loc.cityLabel,
        street: loc.street,
        neighborhood: loc.neighborhood,
      });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'CEP não encontrado.',
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const tutorName = String(body.tutorName || '').trim();
      const login = String(body.login || '').trim().toLowerCase();
      const password = String(body.password || '');
      const cepDigits = String(body.cep || '').replace(/\D/g, '');
      const dogName = String(body.dogName || '').trim();
      const dogBreed = String(body.dogBreed || 'SRD').trim();
      const dogWeightKg = Math.max(1, Math.min(90, Number(body.dogWeightKg) || 10));
      const coatTypeRaw = String(body.coatType || 'short');
      const coatType: CoatType =
        coatTypeRaw === 'double' || coatTypeRaw === 'long' ? coatTypeRaw : 'short';
      const rawPhoto = String(body.dogPhoto || '');
      const dogPhoto = isSafePhoto(rawPhoto)
        ? rawPhoto
        : '/src/assets/images/hero_corgi_walk_1795721561419.jpg';

      if (!tutorName || !EMAIL_REGEX.test(login)) {
        res.status(400).json({ error: 'Informe nome e e-mail válidos.' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
      }
      if (cepDigits.length !== 8) {
        res.status(400).json({ error: 'Informe um CEP válido com 8 dígitos.' });
        return;
      }
      if (!dogName) {
        res.status(400).json({ error: 'Informe o nome do cachorro.' });
        return;
      }

      const loc = await resolveCepLocation(cepDigits);
      const db = readDb();
      if (db.users.some((u) => u.login === login)) {
        res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const user: StoredUser = {
        id: `usr_${crypto.randomUUID()}`,
        tutorName,
        login,
        passwordHash: hashPassword(password, salt),
        passwordSalt: salt,
        cep: loc.cep,
        dogName,
        dogBreed,
        dogWeightKg,
        coatType,
        dogPhoto,
        createdAt: new Date().toISOString(),
      };

      db.users.push(user);
      writeDb(db);

      res.status(201).json({ user: toPublicUser(user) });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Erro ao concluir cadastro.',
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const login = String(body.login || '').trim().toLowerCase();
      const password = String(body.password || '');

      const db = readDb();
      const user = db.users.find((u) => u.login === login);
      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        return;
      }

      const weather = await buildWeatherForCep(user.cep, user.dogName);
      const token = signToken(user.id);

      res.json({
        token,
        user: toPublicUser(user),
        weather,
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao consultar condições climáticas no login.',
      });
    }
  });

  function requireAuth(
    req: express.Request,
    res: express.Response
  ): StoredUser | null {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return null;
    }
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return null;
    }
    return user;
  }

  app.post('/api/passeio', async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    try {
      const weather = await buildWeatherForCep(user.cep, user.dogName);
      if (weather.hasRain || !weather.canWalk) {
        res.status(403).json({
          error:
            weather.rainBlockMessage ||
            weather.heatWarning ||
            'Não é seguro iniciar o passeio nas condições climáticas atuais.',
        });
        return;
      }

      const walk: StoredWalk = {
        id: `walk_${crypto.randomUUID()}`,
        userId: user.id,
        userLogin: user.login,
        tutorName: user.tutorName,
        dogName: user.dogName,
        dogBreed: user.dogBreed,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        status: 'in_progress',
        durationSec: 0,
        distanceKm: 0,
        caloriesKcal: 0,
        pace: 'moderate',
        cep: weather.cep,
        cityLabel: weather.cityLabel,
        temperatureC: weather.temperatureC,
        hasRain: weather.hasRain,
        condition: weather.condition,
        excessiveHeat: weather.excessiveHeat,
        notes: '',
      };

      const db = readDb();
      db.walks.unshift(walk);
      writeDb(db);
      res.status(201).json(toPublicWalk(walk));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Não foi possível iniciar o passeio.',
      });
    }
  });

  app.get('/api/finalizacao', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const walks = readDb().walks
      .filter((walk) => walk.userId === user.id)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    res.json(summarizeWalks(walks));
  });

  app.post('/api/finalizacao', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const body = req.body as Record<string, unknown>;
    const walkId = typeof body.walkId === 'string' ? body.walkId.trim() : '';
    const durationSeconds = body.durationSeconds;
    if (!walkId || typeof durationSeconds !== 'number' ||
      !Number.isInteger(durationSeconds) || durationSeconds < 1) {
      res.status(400).json({ error: 'Informe um passeio e uma duração válida em segundos.' });
      return;
    }

    const db = readDb();
    const walk = db.walks.find(
      (record) => record.id === walkId && record.userId === user.id,
    );
    if (!walk || walk.status === 'completed') {
      res.status(404).json({ error: 'Passeio em andamento não encontrado.' });
      return;
    }

    walk.status = 'completed';
    walk.finishedAt = new Date().toISOString();
    walk.durationSec = durationSeconds;
    walk.caloriesKcal = Math.round((durationSeconds / 60) * 4.2 * 100) / 100;
    writeDb(db);

    const summary = summarizeWalks(
      db.walks
        .filter((record) => record.userId === user.id)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    );
    res.json({
      walk: toPublicWalk(walk),
      history: summary.walks,
      totals: summary.totals,
    });
  });

  app.get('/api/weather', async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const weather = await buildWeatherForCep(user.cep, user.dogName);
      res.json({ weather });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao atualizar clima.',
      });
    }
  });

  app.get('/api/walks', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDb();
    const walks = db.walks
      .filter((w) => w.userId === user.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    res.json({ walks });
  });

  app.post('/api/walks', async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const body = req.body as Record<string, unknown>;
      const durationSec = Math.max(1, Math.min(43200, Math.round(Number(body.durationSec) || 0)));
      const distanceKm = Math.max(0, Math.min(100, Number(body.distanceKm) || 0));
      const caloriesKcal = Math.max(0, Math.min(5000, Number(body.caloriesKcal) || 0));
      const paceRaw = String(body.pace || 'moderate');
      const pace: WalkPace =
        paceRaw === 'light' || paceRaw === 'brisk' ? paceRaw : 'moderate';
      const notes = String(body.notes || '').trim().slice(0, 160);
      const startedAt =
        typeof body.startedAt === 'string' && !Number.isNaN(Date.parse(body.startedAt))
          ? body.startedAt
          : new Date().toISOString();

      const weather = await buildWeatherForCep(user.cep, user.dogName);
      const walk: StoredWalk = {
        id: `walk_${crypto.randomUUID()}`,
        userId: user.id,
        dogName: user.dogName,
        dogBreed: user.dogBreed,
        startedAt,
        durationSec,
        distanceKm: Math.round(distanceKm * 100) / 100,
        caloriesKcal: Math.round(caloriesKcal * 10) / 10,
        pace,
        cep: weather.cep,
        cityLabel: weather.cityLabel,
        temperatureC: weather.temperatureC,
        condition: weather.condition,
        excessiveHeat: weather.excessiveHeat,
        notes,
      };

      const db = readDb();
      db.walks.unshift(walk);
      writeDb(db);

      res.status(201).json({ walk });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Erro ao registrar passeio.',
      });
    }
  });

  app.delete('/api/walks/:id', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDb();
    const target = db.walks.find((w) => w.id === req.params.id);
    if (!target || target.userId !== user.id) {
      res.status(404).json({ error: 'Registro não encontrado.' });
      return;
    }
    db.walks = db.walks.filter((w) => w.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

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
    app.get(/.*/, (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PasseieAu server listening on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/docs/`);
  });
}

startServer();
