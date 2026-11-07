// The energy model. Pure functions, no DOM, no network — so it can be tested
// with `node --test` and reused by the coach, the docs and the pitch.

import { APPLIANCES, ACTIONS, HEATING_TYPES, HOT_WATER, BULBS, DEFAULT_PROFILE } from './data.js';

const VAT = 1.25;
const HOURS_PER_YEAR = 8760;
const FALLBACK_SPOT = 0.85; // kr/kWh, rough Swedish yearly average

/** Deep-merge a partial profile onto the defaults (used by the UI and tests). */
export function normalizeProfile(partial = {}) {
  const p = { ...DEFAULT_PROFILE, ...partial };
  return {
    ...p,
    tariff: { ...DEFAULT_PROFILE.tariff, ...(partial.tariff || {}) },
    bulbs: { ...DEFAULT_PROFILE.bulbs, ...(partial.bulbs || {}) },
    appliances: { ...DEFAULT_PROFILE.appliances, ...(partial.appliances || {}) },
    flags: { ...DEFAULT_PROFILE.flags, ...(partial.flags || {}) },
    co2: { ...DEFAULT_PROFILE.co2, ...(partial.co2 || {}) },
  };
}

/** Spot -> what the student actually pays, including VAT, grid and fees. */
export function electricityPrice(profile, spotSek = FALLBACK_SPOT) {
  if (profile.tariff?.type === 'fixed') return profile.tariff.fixed;
  const markup = profile.tariff?.markup ?? 0.35;
  return (spotSek + markup) * VAT;
}

export function heatPrice(profile, elecPrice) {
  return profile.heating === 'district' ? profile.districtPrice : elecPrice;
}

const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

function standbyKwh(profile) {
  return APPLIANCES.reduce((sum, a) => {
    if (a.alwaysOn) return sum;
    const count = profile.appliances?.[a.id] ?? 0;
    return sum + count * (a.standbyW || 0);
  }, 0) * HOURS_PER_YEAR / 1000;
}

function lightingKwh(profile) {
  const { count, type, hours } = profile.bulbs;
  const w = BULBS[type]?.w ?? BULBS.led.w;
  return count * w * hours * 365 / 1000;
}

/** Baseline: where the kWh go today, before any advice. */
export function baseline(profile, spotSek = FALLBACK_SPOT) {
  const elec = electricityPrice(profile, spotSek);
  const heat = heatPrice(profile, elec);
  const ht = HEATING_TYPES[profile.heating] ?? HEATING_TYPES.district;

  const heatingKwh = (ht.usefulKwhPerM2 * profile.area) / ht.eff;

  const litresPerDay = profile.people * profile.showerMin * HOT_WATER.showerLpm * HOT_WATER.extraUse;
  const hotWaterThermal = (litresPerDay * HOT_WATER.deltaT * 4.18 / 3600) * 365;
  const hotWaterKwh = hotWaterThermal / ht.hotWaterEff;

  const plugKwh = APPLIANCES.reduce(
    (sum, a) => sum + (profile.appliances?.[a.id] ?? 0) * a.kwh, 0,
  );
  const standby = standbyKwh(profile);
  const light = lightingKwh(profile);

  const co2Heat = profile.heating === 'district' ? profile.co2.district : profile.co2.electricity;
  const co2Elec = profile.co2.electricity;

  const rows = [
    { id: 'heating',   label: 'Space heating', detail: `${ht.label} · ${profile.area} m²`, kwh: heatingKwh,     price: heat,      co2: co2Heat },
    { id: 'hotwater',  label: 'Hot water',     detail: `${profile.showerMin} min showers`,    kwh: hotWaterKwh,    price: heat,      co2: co2Heat },
    { id: 'appliances',label: 'Appliances',    detail: 'Fridge, cooking, laundry, screens',   kwh: plugKwh,        price: elec,      co2: co2Elec },
    { id: 'lighting',  label: 'Lighting',      detail: `${profile.bulbs.count} × ${BULBS[profile.bulbs.type].label}`, kwh: light, price: elec, co2: co2Elec },
    { id: 'standby',   label: 'Standby',       detail: 'Devices that never really sleep',     kwh: standby,        price: elec,      co2: co2Elec },
  ].map((r) => ({ ...r, kwh: round(r.kwh), sek: round(r.kwh * r.price), co2: round(r.kwh * r.co2 / 1000, 1) }));

  const totalKwh = rows.reduce((s, r) => s + r.kwh, 0);
  const totalSek = rows.reduce((s, r) => s + r.sek, 0);
  const totalCo2 = rows.reduce((s, r) => s + r.co2, 0);

  for (const r of rows) r.share = totalKwh ? r.kwh / totalKwh : 0;

  return {
    rows,
    totalKwh: round(totalKwh),
    totalSek: round(totalSek),
    totalCo2: round(totalCo2, 1),
    elecPrice: elec,
    heatPrice: heat,
    heatingKwh: round(heatingKwh),
    hotWaterKwh: round(hotWaterKwh),
    standbyKwh: round(standby),
    fridgeKwh: round((profile.appliances?.fridge ?? 0) * 180),
    dryerKwh: round((profile.appliances?.dryer ?? 0) * 250),
    shiftableKwh: round(APPLIANCES.filter((a) => a.shiftable)
      .reduce((s, a) => s + (profile.appliances?.[a.id] ?? 0) * a.kwh, 0)),
  };
}

/* ------------------------------------------------------------------ */
/* Price helpers                                                       */
/* ------------------------------------------------------------------ */

export function slotHours(slot) {
  const ms = new Date(slot.end) - new Date(slot.start);
  return Math.max(0.25, ms / 3_600_000);
}

/** Cheapest contiguous block of `hours` in the price curve. */
export function cheapestBlock(slots, hours = 4) {
  if (!slots?.length) return null;
  const n = Math.max(1, Math.round(hours / slotHours(slots[0])));
  if (n >= slots.length) {
    const all = slots.reduce((s, x) => s + x.sek, 0) / slots.length;
    return { start: slots[0].start, end: slots[slots.length - 1].end, mean: all, slots: slots.length };
  }
  let best = null;
  for (let i = 0; i + n <= slots.length; i++) {
    const mean = slots.slice(i, i + n).reduce((s, x) => s + x.sek, 0) / n;
    if (!best || mean < best.mean) {
      best = { start: slots[i].start, end: slots[i + n - 1].end, mean, slots: n };
    }
  }
  return best;
}

export function meanPriceBetween(slots, fromHour, toHour) {
  const picked = slots.filter((s) => {
    const h = new Date(s.start).getHours();
    return h >= fromHour && h < toHour;
  });
  if (!picked.length) return null;
  return picked.reduce((s, x) => s + x.sek, 0) / picked.length;
}

export function priceNow(slots) {
  if (!slots?.length) return null;
  const now = Date.now();
  return slots.find((s) => new Date(s.start).getTime() <= now && new Date(s.end).getTime() > now)
    ?? slots[0];
}

export function priceStats(slots) {
  if (!slots?.length) return null;
  const v = slots.map((s) => s.sek);
  return {
    min: Math.min(...v),
    max: Math.max(...v),
    avg: v.reduce((a, b) => a + b, 0) / v.length,
  };
}

/* ------------------------------------------------------------------ */
/* Waste detection + action plan                                       */
/* ------------------------------------------------------------------ */

export function detectActions(profile, base, priceInfo) {
  const out = [];
  const co2Elec = profile.co2.electricity;
  const co2Heat = profile.heating === 'district' ? profile.co2.district : co2Elec;

  const push = (id, kwh, price, co2) => {
    if (!(kwh > 0.5)) return;
    const action = ACTIONS[id];
    out.push({
      id,
      ...action,
      kwh: round(kwh, 0),
      sek: round(kwh * price),
      co2: round(kwh * co2 / 1000, 1),
      payback: action.upfront ? round(action.upfront / Math.max(1, kwh * price), 1) : null,
    });
  };

  /* Heating — never claim more than a third of it. */
  const heat = [];
  if (profile.indoorTemp > 20) {
    const delta = Math.min(3, profile.indoorTemp - 20);
    heat.push(['heating_setback', base.heatingKwh * 0.05 * delta]);
  }
  if (profile.flags.blockedRadiators) heat.push(['heating_blocked', base.heatingKwh * 0.07]);
  if (profile.flags.windowOpenHeating) heat.push(['heating_windows', base.heatingKwh * 0.06]);
  if (profile.flags.draftyWindows) heat.push(['heating_drafts', base.heatingKwh * 0.04]);

  const heatSum = heat.reduce((s, [, v]) => s + v, 0);
  const heatCap = base.heatingKwh * 0.35;
  const heatScale = heatSum > heatCap ? heatCap / heatSum : 1;
  for (const [id, kwh] of heat) push(id, kwh * heatScale, base.heatPrice, co2Heat);

  /* Hot water */
  if (profile.showerMin > 5 && base.hotWaterKwh > 0) {
    const target = Math.max(4.5, profile.showerMin - 3);
    const saved = base.hotWaterKwh * (1 - target / profile.showerMin);
    push('hot_water_shower', saved, base.heatPrice, co2Heat);
  }

  /* Standby */
  if (base.standbyKwh > 2) push('standby', base.standbyKwh * 0.9, base.elecPrice, co2Elec);

  /* Lighting */
  if (profile.bulbs.type !== 'led' && profile.bulbs.count > 0) {
    const deltaW = BULBS[profile.bulbs.type].w - BULBS.led.w;
    const saved = profile.bulbs.count * deltaW * profile.bulbs.hours * 365 / 1000;
    push('lighting', saved, base.elecPrice, co2Elec);
  }

  /* Fridge running too cold */
  const fridgeTarget = profile.fridgeTarget ?? 4;
  if (profile.fridgeTemp < fridgeTarget) {
    const saved = base.fridgeKwh * 0.05 * (fridgeTarget - profile.fridgeTemp);
    push('fridge_temp', saved, base.elecPrice, co2Elec);
  }

  /* Tumble dryer */
  if (base.dryerKwh > 0) push('dryer', base.dryerKwh * 0.85, base.elecPrice, co2Elec);

  /* Load shifting — same kWh, cheaper hours */
  const shift = shiftEstimate(profile, priceInfo);
  if (shift && shift.sekYear > 30) {
    out.push({
      id: 'price_shift',
      ...ACTIONS.price_shift,
      kwh: 0,
      sek: round(shift.sekYear),
      co2: 0,
      payback: null,
      shift,
    });
  }

  return out.sort((a, b) => b.sek - a.sek);
}

export function shiftEstimate(profile, priceInfo) {
  const slots = priceInfo?.slots;
  if (!slots?.length) return null;
  const shiftable = APPLIANCES.filter((a) => a.shiftable)
    .reduce((s, a) => s + (profile.appliances?.[a.id] ?? 0) * a.kwh, 0);
  if (!shiftable) return null;

  const cheap = cheapestBlock(slots, 4);
  const peak = meanPriceBetween(slots, 17, 21);
  if (!cheap || peak == null) return null;

  const diff = Math.max(0, peak - cheap.mean);
  const weekly = shiftable / 52;
  return {
    kwhYear: round(shiftable),
    weekKwh: round(weekly, 1),
    peakPrice: round(peak, 3),
    cheapPrice: round(cheap.mean, 3),
    diff: round(diff, 3),
    savingPerKwh: round(diff * VAT, 3),
    sekYear: round(weekly * diff * VAT * 52),
    window: { start: cheap.start, end: cheap.end },
  };
}

/**
 * Everything the UI needs in one object.
 * `priceInfo` is optional: without it we use a typical Swedish spot price.
 */
export function computeModel(profile, priceInfo = null) {
  const spot = priceInfo?.stats?.avg ?? FALLBACK_SPOT;
  const base = baseline(profile, spot);
  const actions = detectActions(profile, base, priceInfo);
  const shift = shiftEstimate(profile, priceInfo);

  const savedKwh = actions.reduce((s, a) => s + a.kwh, 0);
  const savedSek = actions.reduce((s, a) => s + a.sek, 0);
  const savedCo2 = actions.reduce((s, a) => s + a.co2, 0);

  return {
    profile,
    base,
    actions,
    shift,
    priceInfo: priceInfo ?? null,
    spot,
    savedKwh: round(savedKwh),
    savedSek: round(savedSek),
    savedCo2: round(savedCo2, 1),
    savedPct: base.totalKwh ? savedKwh / base.totalKwh : 0,
  };
}
