export function formatConcentration(value: number, unit: string): string {
  const decimals = unit === 'ppm' ? 1 : value < 10 ? 1 : 0;
  return `${value.toFixed(decimals)} ${unit}`;
}

export function formatAQI(value: number): string {
  return Math.round(value).toString();
}

const WIND_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function formatWindDir(deg: number): string {
  const index = Math.round(deg / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

export function formatWindFull(speed: number, dir: number): string {
  return `${speed.toFixed(1)} m/s from ${Math.round(dir)}° (${formatWindDir(dir)})`;
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
