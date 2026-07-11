import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  type LucideIcon,
} from "lucide-react";

export type DayWeather = {
  code: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  label: string;
  isForecast?: boolean;
  isExtendedForecast?: boolean;
};

export type WeatherSummary = {
  avgTempMax: number;
  avgTempMin: number;
  totalPrecipitation: number;
  rainyDays: number;
  daysWithData: number;
  daysInMonth: number;
  forecastDays: number;
  extendedForecastDays: number;
  dominantLabel: string;
  dominantCode: number;
};

export const LA_ARADA_LOCATION = "San José La Arada, Chiquimula";

const WEATHER_MAP: Record<number, { icon: LucideIcon; label: string }> = {
  0: { icon: Sun, label: "Despejado" },
  1: { icon: CloudSun, label: "Mayormente despejado" },
  2: { icon: CloudSun, label: "Parcialmente nublado" },
  3: { icon: Cloud, label: "Nublado" },
  45: { icon: CloudFog, label: "Niebla" },
  48: { icon: CloudFog, label: "Niebla con escarcha" },
  51: { icon: CloudDrizzle, label: "Llovizna leve" },
  53: { icon: CloudDrizzle, label: "Llovizna moderada" },
  55: { icon: CloudDrizzle, label: "Llovizna intensa" },
  61: { icon: CloudRain, label: "Lluvia leve" },
  63: { icon: CloudRain, label: "Lluvia moderada" },
  65: { icon: CloudRain, label: "Lluvia intensa" },
  71: { icon: CloudSnow, label: "Nieve leve" },
  73: { icon: CloudSnow, label: "Nieve moderada" },
  75: { icon: CloudSnow, label: "Nieve intensa" },
  80: { icon: CloudRain, label: "Chubascos leves" },
  81: { icon: CloudRain, label: "Chubascos moderados" },
  82: { icon: CloudRain, label: "Chubascos fuertes" },
  95: { icon: CloudLightning, label: "Tormenta" },
  96: { icon: CloudLightning, label: "Tormenta con granizo" },
  99: { icon: CloudLightning, label: "Tormenta con granizo fuerte" },
};

export const WEATHER_EMOJI: Record<number, string> = {
  0: "☀",
  1: "🌤",
  2: "⛅",
  3: "☁",
  45: "🌫",
  48: "🌫",
  51: "🌦",
  53: "🌦",
  55: "🌧",
  61: "🌧",
  63: "🌧",
  65: "🌧",
  71: "❄",
  73: "❄",
  75: "❄",
  80: "🌦",
  81: "🌧",
  82: "⛈",
  95: "⛈",
  96: "⛈",
  99: "⛈",
};

export function getWeatherInfo(code: number) {
  return WEATHER_MAP[code] ?? { icon: Cloud, label: "Desconocido" };
}

export function getWeatherIcon(code: number): LucideIcon {
  return getWeatherInfo(code).icon;
}

export function getWeatherEmoji(code: number) {
  return WEATHER_EMOJI[code] ?? "·";
}

export async function fetchMonthlyWeather(
  year: number,
  month: number,
  daysInMonth: number,
): Promise<{
  days: Record<number, DayWeather>;
  summary: WeatherSummary | null;
  hasForecast: boolean;
}> {
  try {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      days: String(daysInMonth),
    });
    const res = await fetch(`/api/weather?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return { days: {}, summary: null, hasForecast: false };
    const data = await res.json();
    const days = data.days ?? {};
    return {
      days,
      summary: data.summary ?? null,
      hasForecast: Boolean(data.hasForecast ?? Object.keys(days).length > 0),
    };
  } catch {
    return { days: {}, summary: null, hasForecast: false };
  }
}
