const nf = (d) => new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: d,
  maximumFractionDigits: d,
});

export const num = (n, d = 0) => nf(d).format(Number.isFinite(n) ? n : 0);
export const sek = (n, d = 0) => `${num(n, d)} kr`;
export const kwh = (n, d = 0) => `${num(n, d)} kWh`;
export const pct = (n, d = 0) => `${num(n * 100, d)}%`;
export const kg = (n, d = 1) => `${num(n, d)} kg`;

export const clock = (iso) => new Date(iso)
  .toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

export const dayLabel = (iso) => new Date(iso)
  .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const price = (n, d = 2) => `${num(n, d)} kr/kWh`;
