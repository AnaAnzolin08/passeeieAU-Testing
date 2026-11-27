import assert from 'node:assert/strict';
import { evaluateWalkSafety } from '../src/services/walkSafety.ts';

describe('RN03/RN04 - validação climática do passeio', () => {
  it('bloqueia a chuva independentemente da temperatura e do horário', () => {
    assert.deepEqual(evaluateWalkSafety(20, true, '2026-11-27T18:00'), {
      excessiveHeat: false,
      blockedByHeat: false,
      canWalk: false,
    });
  });

  it('permite exatamente 27°C no período de calor', () => {
    assert.deepEqual(evaluateWalkSafety(27, false, '2026-11-27T12:00'), {
      excessiveHeat: false,
      blockedByHeat: false,
      canWalk: true,
    });
  });

  it('bloqueia temperaturas acima de 27°C das 9h até antes das 16h', () => {
    for (const observedAt of ['2026-11-27T09:00', '2026-11-27T15:59']) {
      assert.deepEqual(evaluateWalkSafety(27.1, false, observedAt), {
        excessiveHeat: true,
        blockedByHeat: true,
        canWalk: false,
      });
    }
  });

  it('permite temperaturas acima de 27°C fora do horário de bloqueio', () => {
    for (const observedAt of ['2026-11-27T08:59', '2026-11-27T16:00', '2026-11-27T18:00']) {
      assert.deepEqual(evaluateWalkSafety(28, false, observedAt), {
        excessiveHeat: true,
        blockedByHeat: false,
        canWalk: true,
      });
    }
  });

  it('falha com erro se não puder validar o horário de uma temperatura alta', () => {
    assert.throws(
      () => evaluateWalkSafety(28, false, 'horário inválido'),
      /Horário da previsão climática inválido/,
    );
  });
});
