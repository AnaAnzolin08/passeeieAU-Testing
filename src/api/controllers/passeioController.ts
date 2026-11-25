import type { Response } from 'express';
import { memoryDb } from '../../db/memoryDb.ts';
import { InvalidCepError, lookupWeatherByCep } from '../../services/weatherServer.ts';
import type { ErrorResponse, WalkRecord } from '../../types.ts';
import type { AuthenticatedRequest } from '../auth.ts';

/**
 * POST /api/passeio
 * Inicia um passeio após validar ausência de chuva no CEP do tutor autenticado.
 */
export async function startPasseioController(
  req: AuthenticatedRequest,
  res: Response<WalkRecord | ErrorResponse>,
): Promise<void> {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  try {
    const weather = await lookupWeatherByCep(user.cep);
    if (weather.hasRain || !weather.canWalk) {
      res.status(403).json({
        error:
          weather.rainBlockMessage ||
          weather.heatWarning ||
          'Alerta climático para este CEP: não é seguro iniciar o passeio agora.',
      });
      return;
    }

    const walk = memoryDb.walks.insertOne({
      userId: user._id,
      userLogin: user.login,
      tutorName: user.tutorName,
      dogName: user.dogName,
      cep: weather.cep,
      weatherSummary: weather.condition,
      temperatureC: weather.temperatureC,
      hasRain: weather.hasRain,
      excessiveHeat: weather.excessiveHeat,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationSeconds: 0,
      caloriesBurned: 0,
    });

    res.status(201).json(walk);
  } catch (err) {
    if (err instanceof InvalidCepError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Não foi possível iniciar o passeio.' });
  }
}
