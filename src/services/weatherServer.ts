import type { WeatherReport } from '../types.ts';
import { evaluateWalkSafety } from './walkSafety.ts';

const HEAT_CAUTION_MESSAGE =
  'A temperatura está acima de 27°C, mas fora do horário de bloqueio. Prefira locais sombreados e leve água fresca.';

const HEAT_BLOCK_MESSAGE =
  'Temperatura acima de 27°C entre 9h e 16h. O início do passeio foi bloqueado preventivamente.';

const RAIN_BLOCK_MESSAGE =
  'Alerta de Tempo Chuvoso: A chuva aumenta o risco de hipotermia, quedas em pisos escorregadios, sustos com trovoadas e dermatites por umidade nas patas e pelagem. Mantenha seu cachorro em local seco e protegido e aguarde o tempo firmar. O início do passeio foi bloqueado preventivamente.';

function currentSaoPauloTimestamp(): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

function evaluateHeatRule(temperatureC: number, observedAt = currentSaoPauloTimestamp()): {
  isCaution: boolean;
  isExtremeBlock: boolean;
  excessiveHeat: boolean;
  heatWarning: string | null;
} {
  const { excessiveHeat, blockedByHeat: isExtremeBlock } = evaluateWalkSafety(
    temperatureC,
    false,
    observedAt,
  );
  const isCaution = excessiveHeat && !isExtremeBlock;
  return {
    isCaution,
    isExtremeBlock,
    excessiveHeat,
    heatWarning: isExtremeBlock ? HEAT_BLOCK_MESSAGE : isCaution ? HEAT_CAUTION_MESSAGE : null,
  };
}

const UF_TO_STATE: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const weatherCache = new Map<string, { report: WeatherReport; expiresAt: number }>();

export function clearWeatherCache(): void {
  weatherCache.clear();
}

function formatCep(digits: string): string {
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

function describeWmoCode(code: number): { condition: string; isRainCode: boolean } {
  if (code === 0) return { condition: 'Céu limpo', isRainCode: false };
  if (code === 1) return { condition: 'Predominantemente limpo', isRainCode: false };
  if (code === 2) return { condition: 'Parcialmente nublado', isRainCode: false };
  if (code === 3) return { condition: 'Nublado', isRainCode: false };
  if (code === 45 || code === 48) return { condition: 'Neblina', isRainCode: false };
  if (code >= 51 && code <= 55) return { condition: 'Garoa', isRainCode: true };
  if (code === 56 || code === 57) return { condition: 'Garoa congelante', isRainCode: true };
  if (code === 61) return { condition: 'Chuva leve', isRainCode: true };
  if (code === 63) return { condition: 'Chuva moderada', isRainCode: true };
  if (code === 65) return { condition: 'Chuva forte', isRainCode: true };
  if (code === 66 || code === 67) return { condition: 'Chuva congelante', isRainCode: true };
  if (code >= 80 && code <= 82) return { condition: 'Pancadas de chuva', isRainCode: true };
  if (code >= 95 && code <= 99) return { condition: 'Tempestade com chuva', isRainCode: true };
  return { condition: 'Tempo estável', isRainCode: false };
}

function buildFallbackWeather(digits: string, cityLabel?: string): WeatherReport {
  const formatted = formatCep(digits);
  const regionFallback: Record<
    string,
    { label: string; temp: number; condition: string; rain: boolean }
  > = {
    '0': { label: 'São Paulo, SP', temp: 23, condition: 'Parcialmente nublado', rain: false },
    '1': { label: 'Interior de São Paulo, SP', temp: 25, condition: 'Ensolarado', rain: false },
    '2': { label: 'Rio de Janeiro, RJ', temp: 29, condition: 'Sol e calor', rain: false },
    '3': { label: 'Belo Horizonte, MG', temp: 25, condition: 'Parcialmente nublado', rain: false },
    '4': { label: 'Salvador, BA', temp: 31, condition: 'Sol intenso · Calor excessivo', rain: false },
    '5': { label: 'Recife, PE', temp: 30, condition: 'Sol intenso · Calor excessivo', rain: false },
    '6': { label: 'Fortaleza / Norte-Nordeste', temp: 31, condition: 'Calor intenso', rain: false },
    '7': { label: 'Brasília / Centro-Oeste', temp: 26, condition: 'Tempo aberto', rain: false },
    '8': { label: 'Curitiba, PR', temp: 17, condition: 'Chuva leve', rain: true },
    '9': { label: 'Porto Alegre, RS', temp: 21, condition: 'Parcialmente nublado', rain: false },
  };
  const base = regionFallback[digits[0]] ?? regionFallback['0'];
  const heat = evaluateHeatRule(base.temp);
  return {
    cep: formatted,
    cityLabel: cityLabel || base.label,
    condition:
      heat.isExtremeBlock && !base.rain
        ? `${base.condition} · Calor excessivo (> 27°C, 9h–16h)`
        : heat.isCaution && !base.rain
          ? `${base.condition} · Atenção redobrada`
          : base.condition,
    temperatureC: base.temp,
    hasRain: base.rain,
    excessiveHeat: heat.excessiveHeat,
    canWalk: !base.rain && !heat.isExtremeBlock,
    heatWarning: heat.heatWarning,
    rainBlockMessage: base.rain ? RAIN_BLOCK_MESSAGE : null,
  };
}

async function fetchWithTimeout(url: string, ms = 2500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class InvalidCepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCepError';
  }
}

export async function lookupWeatherByCep(rawCep: string): Promise<WeatherReport> {
  const digits = rawCep.replace(/\D/g, '');
  if (!/^\d{8}$/.test(digits) || digits === '00000000') {
    throw new InvalidCepError('CEP não encontrado ou inválido. Informe 8 dígitos.');
  }


  const cached = weatherCache.get(digits);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.report;
  }

  let city = '';
  let state = '';

  try {
    const viaRes = await fetchWithTimeout(`https://viacep.com.br/ws/${digits}/json/`, 2500);
    if (viaRes.ok) {
      const viaData = (await viaRes.json()) as {
        erro?: boolean;
        localidade?: string;
        uf?: string;
      };
      if (viaData.erro) {
        throw new InvalidCepError('CEP não encontrado. Verifique os dígitos informados.');
      }
      if (viaData.localidade && viaData.uf) {
        city = viaData.localidade;
        state = viaData.uf;
      }
    }
  } catch (err) {
    if (err instanceof InvalidCepError) {
      throw err;
    }
  }

  if (!city || !state) {
    const fallback = buildFallbackWeather(digits);
    weatherCache.set(digits, { report: fallback, expiresAt: Date.now() + 10 * 60 * 1000 });
    return fallback;
  }

  const cityLabel = `${city}, ${state}`;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=8&language=pt&countryCode=BR`;
    const geoRes = await fetchWithTimeout(geoUrl, 2500);
    if (!geoRes.ok) {
      return buildFallbackWeather(digits, cityLabel);
    }

    const geoData = (await geoRes.json()) as {
      results?: Array<{ latitude: number; longitude: number; admin1?: string }>;
    };
    const results = geoData.results ?? [];
    if (results.length === 0) {
      return buildFallbackWeather(digits, cityLabel);
    }

    const fullState = UF_TO_STATE[state.toUpperCase()]?.toLowerCase();
    const matched =
      (fullState
        ? results.find((r) => r.admin1?.toLowerCase() === fullState)
        : undefined) ?? results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${matched.latitude}&longitude=${matched.longitude}&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code&timezone=America/Sao_Paulo`;
    const weatherRes = await fetchWithTimeout(weatherUrl, 2500);
    if (!weatherRes.ok) {
      return buildFallbackWeather(digits, cityLabel);
    }

    const weatherData = (await weatherRes.json()) as {
      current?: {
        time?: string;
        temperature_2m?: number;
        apparent_temperature?: number;
        precipitation?: number;
        rain?: number;
        weather_code?: number;
      };
    };

    const current = weatherData.current;
    if (!current || typeof current.temperature_2m !== 'number') {
      return buildFallbackWeather(digits, cityLabel);
    }

    const temperatureC = Math.round(current.temperature_2m * 10) / 10;
    const { condition, isRainCode } = describeWmoCode(Number(current.weather_code ?? 0));
    const hasRain =
      isRainCode || Number(current.rain ?? 0) > 0 || Number(current.precipitation ?? 0) > 0;
    const heat = evaluateHeatRule(temperatureC, current.time ?? currentSaoPauloTimestamp());

    const report: WeatherReport = {
      cep: formatCep(digits),
      cityLabel,
      condition:
        heat.isExtremeBlock && !hasRain
          ? `${condition} · Calor excessivo (> 27°C, 9h–16h)`
          : heat.isCaution && !hasRain
            ? `${condition} · Atenção redobrada`
            : condition,
      temperatureC,
      hasRain,
      excessiveHeat: heat.excessiveHeat,
      canWalk: !hasRain && !heat.isExtremeBlock,
      heatWarning: heat.heatWarning,
      rainBlockMessage: hasRain ? RAIN_BLOCK_MESSAGE : null,
    };

    weatherCache.set(digits, { report, expiresAt: Date.now() + 10 * 60 * 1000 });
    return report;
  } catch {
    return buildFallbackWeather(digits, cityLabel);
  }
}
