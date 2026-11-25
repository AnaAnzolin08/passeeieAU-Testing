import React, { useState } from 'react';
import type { WalkRecord } from '../types.ts';
import { formatDurationHuman, formatShortDateBr } from '../utils/format.ts';

interface CalorieChartProps {
  walks: WalkRecord[];
  highlightedWalkId?: string | null;
}

export const CalorieChart: React.FC<CalorieChartProps> = ({ walks, highlightedWalkId }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (walks.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/70 px-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Nenhum passeio finalizado ainda para compor o gráfico.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Inicie e finalize um passeio na aba Passeio para visualizar suas calorias gastas.
        </p>
      </div>
    );
  }

  const maxCalories = Math.max(
    10,
    ...walks.map((w) => Math.ceil(w.caloriesBurned * 1.15)),
  );

  const chartWidth = 680;
  const chartHeight = 250;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 44;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const slotWidth = plotWidth / walks.length;
  const barWidth = Math.min(54, Math.max(20, slotWidth * 0.56));
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const activeWalk =
    walks.find((w) => w._id === hoveredId) ??
    walks.find((w) => w._id === highlightedWalkId) ??
    walks[walks.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs text-slate-500">Passeio em destaque</p>
          <p className="text-sm font-medium text-slate-900">
            {activeWalk.dogName} · {formatShortDateBr(activeWalk.startedAt)} ·{' '}
            <span className="font-mono tabular-nums">
              {formatDurationHuman(activeWalk.durationSeconds)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Calorias do passeio</p>
          <p className="text-lg font-display font-bold text-amber-700 font-mono tabular-nums">
            {activeWalk.caloriesBurned.toFixed(1)} kcal
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label="Gráfico de calorias gastas por passeio"
        >
          {yTicks.map((ratio) => {
            const val = Math.round(maxCalories * ratio);
            const y = padTop + plotHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={ratio === 0 ? undefined : '4 4'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {walks.map((walk, idx) => {
            const barHeight = Math.max(4, (walk.caloriesBurned / maxCalories) * plotHeight);
            const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = padTop + plotHeight - barHeight;
            const isHighlighted = walk._id === highlightedWalkId || walk._id === hoveredId;

            return (
              <g
                key={walk._id}
                onMouseEnter={() => setHoveredId(walk._id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={isHighlighted ? '#b45309' : '#0f172a'}
                  className="transition-opacity duration-150"
                  opacity={hoveredId && !isHighlighted ? 0.45 : 1}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 7}
                  textAnchor="middle"
                  className="fill-slate-700 text-[11px] font-mono font-medium tabular-nums"
                >
                  {walk.caloriesBurned.toFixed(1)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatShortDateBr(walk.startedAt)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
