import type { Response } from 'express';
import { memoryDb } from '../../db/memoryDb.ts';
import type {
  ErrorResponse,
  FinishWalkResponse,
  WalkHistoryResponse,
  WalkHistoryTotals,
  WalkRecord,
} from '../../types.ts';
import type { AuthenticatedRequest } from '../auth.ts';

const KCAL_PER_MINUTE = 4.2;

function summarizeHistory(walks: WalkRecord[]): WalkHistoryTotals {
  const completed = walks.filter((w) => w.status === 'completed');
  return {
    totalWalks: completed.length,
    totalDurationSeconds: completed.reduce((acc, w) => acc + w.durationSeconds, 0),
    totalCaloriesBurned:
      Math.round(completed.reduce((acc, w) => acc + w.caloriesBurned, 0) * 100) / 100,
  };
}

/**
 * POST /api/finalizacao
 * Encerra um passeio em andamento, calcula calorias gastas e retorna o histórico atualizado.
 */
export function finishPasseioController(
  req: AuthenticatedRequest,
  res: Response<FinishWalkResponse | ErrorResponse>,
): void {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const walkId = typeof body.walkId === 'string' ? body.walkId.trim() : '';

  if (!walkId) {
    res
      .status(400)
      .json({ error: 'Informe o identificador do passeio (walkId) para finalizar.' });
    return;
  }

  const rawDuration = body.durationSeconds;
  if (typeof rawDuration !== 'number' || !Number.isInteger(rawDuration) || rawDuration < 1) {
    res.status(400).json({ error: 'Informe uma duração inteira válida em segundos (>= 1).' });
    return;
  }

  const existing = memoryDb.walks.findOne({ _id: walkId, userId: user._id });
  if (!existing) {
    res.status(404).json({ error: 'Passeio não encontrado para este tutor.' });
    return;
  }

  const safeSeconds = Math.max(1, rawDuration);
  const caloriesBurned = Math.round((safeSeconds / 60) * KCAL_PER_MINUTE * 100) / 100;

  const updated = memoryDb.walks.updateOne(
    { _id: walkId, userId: user._id },
    {
      $set: {
        status: 'completed',
        finishedAt: new Date().toISOString(),
        durationSeconds: safeSeconds,
        caloriesBurned,
      },
    },
  );

  if (!updated) {
    res.status(404).json({ error: 'Passeio não encontrado para finalização.' });
    return;
  }

  const history = memoryDb.walks
    .find({ userId: user._id, status: 'completed' })
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  res.status(200).json({
    walk: updated,
    history,
    totals: summarizeHistory(history),
  });
}

/**
 * GET /api/finalizacao
 * Lista o histórico e o total de calorias dos passeios finalizados pelo tutor autenticado.
 */
export function listFinalizacaoController(
  req: AuthenticatedRequest,
  res: Response<WalkHistoryResponse | ErrorResponse>,
): void {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const walks = memoryDb.walks
    .find({ userId: user._id, status: 'completed' })
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  res.status(200).json({
    walks,
    totals: summarizeHistory(walks),
  });
}
