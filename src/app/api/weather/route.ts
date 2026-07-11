import { NextRequest, NextResponse } from "next/server";

// San José La Arada, Chiquimula, Guatemala
export const LA_ARADA_LOCATION = "San José La Arada, Chiquimula";
const LA_ARADA_LAT = 14.7211;
const LA_ARADA_LON = -89.5863;
const TIMEZONE = "America/Guatemala";

const WEATHER_LABELS: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna leve",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  61: "Lluvia leve",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  71: "Nieve leve",
  73: "Nieve moderada",
  75: "Nieve intensa",
  80: "Chubascos leves",
  81: "Chubascos moderados",
  82: "Chubascos fuertes",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta con granizo fuerte",
};

type DayWeather = {
  code: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  label: string;
  isForecast: boolean;
  isExtendedForecast?: boolean;
};

function getGuatemalaToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: TIMEZONE,
  });
}

function parseDailyWeather(
  data: {
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
    };
  },
  isForecast = false,
): Record<number, DayWeather> {
  const result: Record<number, DayWeather> = {};

  data.daily?.time?.forEach((dateStr, i) => {
    const day = Number(dateStr.split("-")[2]);
    const code = data.daily?.weather_code?.[i] ?? 0;

    result[day] = {
      code,
      tempMax: data.daily?.temperature_2m_max?.[i] ?? 0,
      tempMin: data.daily?.temperature_2m_min?.[i] ?? 0,
      precipitation: data.daily?.precipitation_sum?.[i] ?? 0,
      label: WEATHER_LABELS[code] ?? "Desconocido",
      isForecast,
    };
  });

  return result;
}

function parseForecastMonth(
  data: {
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
    };
  },
  year: number,
  month: number,
  daysInMonth: number,
  today: string,
  extended = false,
) {
  const result: Record<number, DayWeather> = {};

  data.daily?.time?.forEach((dateStr, i) => {
    const [y, m] = dateStr.split("-").map(Number);
    if (y !== year || m !== month + 1) return;

    const day = Number(dateStr.split("-")[2]);
    if (day < 1 || day > daysInMonth) return;

    const code = data.daily?.weather_code?.[i] ?? 0;
    const isFuture = dateStr > today;
    result[day] = {
      code,
      tempMax: data.daily?.temperature_2m_max?.[i] ?? 0,
      tempMin: data.daily?.temperature_2m_min?.[i] ?? 0,
      precipitation: data.daily?.precipitation_sum?.[i] ?? 0,
      label: WEATHER_LABELS[code] ?? "Desconocido",
      isForecast: isFuture || extended,
      isExtendedForecast: extended && isFuture,
    };
  });

  return result;
}

async function fetchEnsembleMonth(
  year: number,
  month: number,
  daysInMonth: number,
  today: string,
) {
  const dailyParams =
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum";
  const url = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${LA_ARADA_LAT}&longitude=${LA_ARADA_LON}&daily=${dailyParams}&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=35&models=gfs_seamless`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return {};

  return parseForecastMonth(
    await res.json(),
    year,
    month,
    daysInMonth,
    today,
    true,
  );
}

function mergeDays(
  target: Record<number, DayWeather>,
  source: Record<number, DayWeather>,
) {
  for (const [day, weather] of Object.entries(source)) {
    const dayNum = Number(day);
    if (!target[dayNum]) {
      target[dayNum] = weather;
    }
  }
}

async function fillMonthGaps(
  result: Record<number, DayWeather>,
  year: number,
  month: number,
  daysInMonth: number,
  today: string,
) {
  const missing = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (!result[d]) missing.push(d);
  }
  if (missing.length === 0) return;

  const ensemble = await fetchEnsembleMonth(
    year,
    month,
    daysInMonth,
    today,
  );
  mergeDays(result, ensemble);
}

function buildSummary(
  days: Record<number, DayWeather>,
  daysInMonth: number,
) {
  const entries = Object.values(days);
  if (entries.length === 0) return null;

  const codeCount: Record<number, number> = {};
  let tempMaxSum = 0;
  let tempMinSum = 0;
  let totalPrecip = 0;
  let rainyDays = 0;

  entries.forEach((d) => {
    tempMaxSum += d.tempMax;
    tempMinSum += d.tempMin;
    totalPrecip += d.precipitation;
    if (d.precipitation > 0.1) rainyDays += 1;
    codeCount[d.code] = (codeCount[d.code] || 0) + 1;
  });

  const dominantCode = Number(
    Object.entries(codeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0,
  );

  return {
    avgTempMax: tempMaxSum / entries.length,
    avgTempMin: tempMinSum / entries.length,
    totalPrecipitation: totalPrecip,
    rainyDays,
    daysWithData: entries.length,
    daysInMonth,
    forecastDays: entries.filter((d) => d.isForecast && !d.isExtendedForecast)
      .length,
    extendedForecastDays: entries.filter((d) => d.isExtendedForecast).length,
    dominantLabel: WEATHER_LABELS[dominantCode] ?? "Variable",
    dominantCode,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const daysInMonth = Number(searchParams.get("days"));

  if (!year || Number.isNaN(month) || !daysInMonth) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const monthStr = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;
  const today = getGuatemalaToday();

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE }),
  );
  const isPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth());
  const isFutureMonth =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth());

  const dailyParams =
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum";
  const baseParams = `latitude=${LA_ARADA_LAT}&longitude=${LA_ARADA_LON}&daily=${dailyParams}&timezone=${encodeURIComponent(TIMEZONE)}`;

  try {
    if (isPastMonth) {
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?${baseParams}&start_date=${startDate}&end_date=${endDate}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        return NextResponse.json({
          days: {},
          summary: null,
          hasForecast: false,
        });
      }
      const days = parseDailyWeather(await res.json(), false);
      return NextResponse.json({
        days,
        summary: buildSummary(days, daysInMonth),
        hasForecast: true,
      });
    }

    const result: Record<number, DayWeather> = {};

    if (isFutureMonth) {
      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?${baseParams}&forecast_days=16`,
        { cache: "no-store" },
      );
      if (forecastRes.ok) {
        mergeDays(
          result,
          parseForecastMonth(
            await forecastRes.json(),
            year,
            month,
            daysInMonth,
            today,
          ),
        );
      }
      await fillMonthGaps(result, year, month, daysInMonth, today);

      for (const w of Object.values(result)) {
        if (w.isForecast) w.isForecast = true;
      }

      const hasForecast = Object.keys(result).length > 0;
      return NextResponse.json({
        days: result,
        summary: hasForecast ? buildSummary(result, daysInMonth) : null,
        hasForecast,
      });
    }

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?${baseParams}&past_days=31&forecast_days=16`,
      { cache: "no-store" },
    );
    if (forecastRes.ok) {
      mergeDays(
        result,
        parseForecastMonth(
          await forecastRes.json(),
          year,
          month,
          daysInMonth,
          today,
        ),
      );
    }

    const archiveEnd = today < endDate ? today : endDate;
    if (startDate <= archiveEnd) {
      const archiveRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?${baseParams}&start_date=${startDate}&end_date=${archiveEnd}`,
        { cache: "no-store" },
      );
      if (archiveRes.ok) {
        const archiveDays = parseDailyWeather(await archiveRes.json(), false);
        for (const [day, weather] of Object.entries(archiveDays)) {
          result[Number(day)] = weather;
        }
      }
    }

    await fillMonthGaps(result, year, month, daysInMonth, today);

    return NextResponse.json({
      days: result,
      summary: buildSummary(result, daysInMonth),
      hasForecast: Object.keys(result).length > 0,
    });
  } catch {
    return NextResponse.json({ days: {}, summary: null, hasForecast: false });
  }
}
