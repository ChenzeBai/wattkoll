// The coach: deterministic answers grounded in the user's own numbers, plus an
// optional pass-through to any OpenAI-compatible endpoint.
//
// The local layer is the default. It is not a language model — it is a small
// intent router over the model output — and the UI says so. The LLM layer is
// what turns those numbers into prose, at the user's own cost and consent.

import * as f from './format.js';

const HAS = (...words) => (q, ...rest) => {
  const s = q.toLowerCase();
  return words.some((w) => s.includes(w)) || rest.some((w) => s.includes(w));
};

const intents = [
  {
    id: 'why',
    match: HAS('why', 'expensive', 'high', 'bill', 'cost', 'dyr', 'kostar'),
    answer: (m) => {
      const top = m.base.rows.slice().sort((a, b) => b.sek - a.sek).slice(0, 2);
      return `<b>${f.sek(m.base.totalSek)}</b> a year is mostly ${top[0].label.toLowerCase()} (${f.sek(top[0].sek)}) and ${top[1].label.toLowerCase()} (${f.sek(top[1].sek)}).
        For a ${m.profile.area} m² flat that is about ${f.kwh(Math.round(m.base.totalKwh / m.profile.area))} per m².
        The fastest money is not a gadget — it is “${m.actions[0] ? m.actions[0].title : 'turning things down'}”:
        ${f.sek(m.actions[0]?.sek ?? 0)} a year for ${m.actions[0]?.effort ?? 'a minute'} of work.`;
    },
  },
  {
    id: 'first',
    match: HAS('first', 'start', 'begin', 'priorit', 'should i do', 'börja'),
    answer: (m) => {
      const [a, b] = m.actions;
      if (!a) return 'Nothing big to fix — your flat is already lean.';
      return `Start with <b>${a.title}</b> — ${f.sek(a.sek)}/yr for ${a.effort} of work.
        Then ${b ? `<b>${b.title}</b> (${f.sek(b.sek)}/yr).` : 'stop there and enjoy the savings.'}
        Just the top three: <b>${f.sek(m.actions.slice(0, 3).reduce((s, x) => s + x.sek, 0))}</b> a year.`;
    },
  },
  {
    id: 'water',
    match: HAS('shower', 'water', 'dusch', 'hot water', 'varmvatten'),
    answer: (m) => `Hot water is <b>${f.sek(m.base.rows.find((r) => r.id === 'hotwater').sek)}</b> a year — ${f.pct(m.base.rows.find((r) => r.id === 'hotwater').share)} of your total.
      A ${m.profile.showerMin}-minute shower is about ${f.num(m.profile.showerMin * 9 * 50 * 4.18 / 3600 / (m.profile.heating === 'district' ? 1 : 0.9), 1)} kWh.
      Cutting to 5 minutes saves ${f.sek(m.actions.find((a) => a.id === 'hot_water_shower')?.sek ?? 0)} a year.`,
  },
  {
    id: 'heat',
    match: HAS('heat', 'warm', 'temperature', 'radiator', 'cold', 'värme', 'element'),
    answer: (m) => {
      const h = m.base.rows.find((r) => r.id === 'heating');
      return `Heating is <b>${f.sek(h.sek)}</b> a year (${f.kwh(h.kwh)}). You keep it at ${m.profile.indoorTemp} °C;
        each degree down is about 5%, so 20 °C would save roughly ${f.sek(h.kwh * 0.05 * Math.max(0, m.profile.indoorTemp - 20) * m.base.heatPrice)}.
        Check the radiator is not blocked by furniture — that alone is ${f.sek(m.actions.find((a) => a.id === 'heating_blocked')?.sek ?? 0)} a year.`;
    },
  },
  {
    id: 'price',
    match: HAS('price', 'when', 'cheap', 'hour', 'spot', 'elpris', 'time'),
    answer: (m) => {
      const s = m.shift;
      if (!s) return 'Your flat has nothing shiftable switched on yet — add a dishwasher or washing machine in “Your place”.';
      return `Today's cheapest four hours start at <b>${f.clock(s.window.start)}</b> (${f.num(s.cheapPrice * 100, 1)} öre/kWh)
        and the 17–21 peak averages ${f.num(s.peakPrice * 100, 1)} öre. Moving your wash and dishes there is worth
        <b>${f.sek(s.sekYear)}</b> a year — same kWh, just better timing.`;
    },
  },
  {
    id: 'co2',
    match: HAS('co', 'carbon', 'climate', 'klimat', 'emission'),
    answer: (m) => `Your flat emits about <b>${f.kg(m.base.totalCo2)} CO₂e</b> a year.
      Cutting it by ${f.kg(m.savedCo2)} is like skipping ${f.num(Math.round(m.savedCo2 / 0.12))} km of driving.
      The biggest single win is usually heat, because it is the biggest slice of the pie.`,
  },
  {
    id: 'fridge',
    match: HAS('fridge', 'freezer', 'kyl', 'frys'),
    answer: (m) => `Your fridge is set to ${m.profile.fridgeTemp} °C. 5 °C is cold enough — every degree colder costs about 5% more,
      which is ${f.sek(m.actions.find((a) => a.id === 'fridge_temp')?.sek ?? 0)} a year here.`,
  },
  {
    id: 'standby',
    match: HAS('standby', 'tv', 'console', 'charger', 'sleep'),
    answer: (m) => `Standby is <b>${f.kwh(m.base.standbyKwh)}</b> a year — ${f.sek(m.base.rows.find((r) => r.id === 'standby').sek)}.
      A single switchable power strip for the TV corner removes about 90% of it.`,
  },
];

function summary(m) {
  const top = m.actions.slice(0, 3)
    .map((a) => `<li>${a.title} — <b>${f.sek(a.sek)}</b>/yr</li>`) .join('');
  return `Short version: you spend <b>${f.sek(m.base.totalSek)}</b> a year on ${f.kwh(m.base.totalKwh)}.
    There is <b>${f.sek(m.savedSek)}</b> (${f.pct(m.savedPct)} of the bill) sitting in the top fixes:
    <ul>${top}</ul>`;
}

export function localAnswer(question, model) {
  const m = { ...model, profile: model.profile ?? {} };
  const hit = intents.find((i) => i.match(question));
  return hit ? hit.answer(m) : summary(m);
}

export function buildContext(model, profile) {
  return {
    flat: {
      area_m2: profile.area,
      people: profile.people,
      housing: profile.housing,
      heating: profile.heating,
      price_area: profile.priceArea,
      indoor_temp_c: profile.indoorTemp,
      shower_minutes: profile.showerMin,
    },
    per_year: {
      kwh: model.base.totalKwh,
      sek: model.base.totalSek,
      kg_co2e: model.base.totalCo2,
      by_end_use: model.base.rows.map((r) => ({ use: r.label, kwh: r.kwh, sek: r.sek })),
    },
    waste_found: model.actions.map((a) => ({
      action: a.title, kwh: a.kwh, sek: a.sek, effort: a.effort,
    })),
    total_saving_sek: model.savedSek,
    electricity_price_sek_kwh: Number(model.base.elecPrice.toFixed(2)),
  };
}

export async function askLLM(question, model, profile, cfg) {
  const res = await fetch(`${cfg.base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model || 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 420,
      messages: [
        {
          role: 'system',
          content: `You are Wattkoll, a friendly energy coach for students in Swedish student housing.
Answer in 2-4 short sentences, plain English, no fluff, no emoji. Use the numbers in the context; never invent new ones.
Amounts are SEK per year. If the question is unrelated to energy, say what you can help with.
Context: ${JSON.stringify(buildContext(model, profile))}`,
        },
        { role: 'user', content: question },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${body.slice(0, 140)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No answer came back.';
}
