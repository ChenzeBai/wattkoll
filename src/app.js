import { computeModel, normalizeProfile } from './model.js';
import { APPLIANCES, HOUSING, HEATING_TYPES, BULBS, PRICE_AREAS, SOURCES, DEFAULT_PROFILE } from './data.js';
import { loadPrices } from './prices.js';
import { localAnswer, askLLM } from './coach.js';
import * as f from './format.js';

const KEY = 'wattkoll.v1';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ───────────────────────── state ───────────────────────── */

function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return normalizeProfile(raw.profile || {});
  } catch {
    return normalizeProfile();
  }
}

function loadPicked() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}').picked || [];
  } catch {
    return [];
  }
}

const state = {
  profile: loadProfile(),
  prices: null,
  model: null,
  picked: new Set(loadPicked()),
  ai: loadAI(),
};

function loadAI() {
  try {
    return JSON.parse(localStorage.getItem('wattkoll.ai') || '{}');
  } catch {
    return {};
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify({
    profile: state.profile,
    picked: [...state.picked],
  }));
}

/* ───────────────────────── form ───────────────────────── */

const p = state.profile;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fieldLabel = (label, out) => `<span>${label}${out ? `<b data-for="${out.path}">${out.value}</b>` : ''}</span>`;

function range(path, { label, min, max, step = 1, unit = '', value }) {
  const pct = ((value - min) / (max - min)) * 100;
  return `<label class="field">
    ${fieldLabel(label, { path, value: `${f.num(value)}${unit}` })}
    <input type="range" data-field="${path}" data-unit="${unit}" min="${min}" max="${max}" step="${step}"
      value="${value}" style="--pct:${pct}%" aria-label="${label}">
  </label>`;
}

function seg(path, { label, options, value }) {
  return `<div class="field">
    <span>${label}</span>
    <div class="seg" data-seg="${path}" role="group" aria-label="${label}">
      ${options.map((o) => `<button type="button" data-value="${o.value}"
        aria-pressed="${String(o.value) === String(value)}">${o.label}</button>`).join('')}
    </div>
  </div>`;
}

function numField(path, { label, value, min, max, step = 0.01, unit = '' }) {
  return `<label class="field">
    ${fieldLabel(label, { path, value: unit })}
    <input type="number" data-field="${path}" value="${value}" min="${min}" max="${max}" step="${step}" inputmode="decimal">
  </label>`;
}

function buildForm() {
  const p = state.profile;
  const apps = APPLIANCES.map((a) => `<button type="button" class="chip" data-app="${a.id}"
    aria-pressed="${(p.appliances[a.id] ?? 0) > 0}">${a.label}</button>`).join('');

  return `
  <div class="group">
    <p class="group-title">The flat</p>
    ${seg('housing', {
      label: 'Housing', value: p.housing,
      options: Object.entries(HOUSING).map(([k, v]) => ({ value: k, label: k === 'corridor' ? 'Corridor' : k === 'studio' ? 'Studio' : 'Shared' })),
    })}
    ${range('area', { label: 'Size', min: 10, max: 90, unit: ' m²', value: p.area })}
    ${range('people', { label: 'People sharing the bill', min: 1, max: 5, value: p.people })}
    <label class="field">
      ${fieldLabel('Heating', null)}
      <select data-field="heating">
        ${Object.entries(HEATING_TYPES).map(([k, v]) => `<option value="${k}" ${k === p.heating ? 'selected' : ''}>${v.label}</option>`).join('')}
      </select>
    </label>
    <label class="field" data-if="district">
      ${fieldLabel('District heat price', null)}
      <input type="number" data-field="districtPrice" value="${p.districtPrice}" min="0.2" max="3" step="0.05" inputmode="decimal">
    </label>
    <label class="field">
      ${fieldLabel('Price area', null)}
      <select data-field="priceArea">
        ${Object.entries(PRICE_AREAS).map(([k, v]) => `<option value="${k}" ${k === p.priceArea ? 'selected' : ''}>${v.label}</option>`).join('')}
      </select>
    </label>
  </div>

  <div class="group">
    <p class="group-title">How you live</p>
    ${range('indoorTemp', { label: 'Indoor temperature', min: 17, max: 24, unit: ' °C', value: p.indoorTemp })}
    ${range('showerMin', { label: 'Shower', min: 2, max: 20, unit: ' min', value: p.showerMin })}
    ${range('fridgeTemp', { label: 'Fridge temperature', min: 2, max: 6, unit: ' °C', value: p.fridgeTemp })}
    ${seg('bulbs.type', {
      label: 'Bulbs', value: p.bulbs.type,
      options: [{ value: 'led', label: 'LED' }, { value: 'halogen', label: 'Halogen' }, { value: 'incandescent', label: 'Old' }],
    })}
    ${range('bulbs.count', { label: 'Bulbs in the flat', min: 1, max: 10, value: p.bulbs.count })}
    ${range('bulbs.hours', { label: 'Light on per day', min: 0.5, max: 10, step: 0.5, unit: ' h', value: p.bulbs.hours })}
    <div class="checks">
      <label class="check"><input type="checkbox" data-field="flags.blockedRadiators" ${p.flags.blockedRadiators ? 'checked' : ''}> Furniture in front of the radiator</label>
      <label class="check"><input type="checkbox" data-field="flags.windowOpenHeating" ${p.flags.windowOpenHeating ? 'checked' : ''}> Windows ajar while heating</label>
      <label class="check"><input type="checkbox" data-field="flags.draftyWindows" ${p.flags.draftyWindows ? 'checked' : ''}> Draughts from windows or doors</label>
    </div>
  </div>

  <div class="group">
    <p class="group-title">Appliances &amp; tariff</p>
    <div class="field">
      <span>What’s plugged in</span>
      <div class="chips">${apps}</div>
    </div>
    ${seg('tariff.type', {
      label: 'Electricity contract', value: p.tariff.type,
      options: [{ value: 'spot', label: 'Spot' }, { value: 'fixed', label: 'Fixed' }],
    })}
    ${numField('tariff.markup', { label: 'Grid, fees & VAT on top', value: p.tariff.markup, min: 0, max: 2, step: 0.05, unit: 'kr/kWh' })}
    <label class="field" data-if="fixed">
      <span>Fixed price <b>kr/kWh incl. VAT</b></span>
      <input type="number" data-field="tariff.fixed" value="${p.tariff.fixed}" min="0.2" max="5" step="0.05" inputmode="decimal">
    </label>
    <p class="hint">Spot prices are today’s SE area average. District heating is usually billed per kWh in the rent.</p>
  </div>`;
}

/* ───────────────────────── bindings ───────────────────────── */

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((a, k) => a?.[k], obj);
}

function syncVisibility() {
  const form = $('#setup-form');
  $$('[data-if]', form).forEach((el) => {
    const kind = el.dataset.if;
    const show = kind === 'district' ? state.profile.heating === 'district'
      : kind === 'fixed' ? state.profile.tariff.type === 'fixed'
      : true;
    el.hidden = !show;
  });
}

function onFormInput(e) {
  const el = e.target;
  const path = el.dataset.field;
  if (!path) return;
  let value;
  if (el.type === 'checkbox') value = el.checked;
  else if (el.type === 'range' || el.type === 'number') value = Number(el.value);
  else value = el.value;

  if (el.type === 'number' && !Number.isFinite(value)) return;
  if (el.type === 'range') {
    const min = Number(el.min); const max = Number(el.max);
    el.style.setProperty('--pct', `${((value - min) / (max - min)) * 100}%`);
    const out = $(`b[data-for="${path}"]`, el.closest('.field'));
    if (out) out.textContent = `${f.num(value)}${el.dataset.unit || ''}`;
  }
  setPath(state.profile, path, value);
  syncVisibility();
  update();
  if (path === 'priceArea') refreshPrices();
}

function onFormClick(e) {
  const segBtn = e.target.closest('.seg button');
  if (segBtn) {
    const segEl = segBtn.closest('.seg');
    const path = segEl.dataset.seg;
    const raw = segBtn.dataset.value;
    const value = raw === 'true' ? true : raw === 'false' ? false : (/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw);
    $$('button', segEl).forEach((b) => b.setAttribute('aria-pressed', b === segBtn));
    setPath(state.profile, path, value);
    syncVisibility();
    update();
    return;
  }

  const chip = e.target.closest('[data-app]');
  if (chip) {
    const id = chip.dataset.app;
    const on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', String(on));
    state.profile.appliances[id] = on ? Math.max(1, state.profile.appliances[id] || 0) : 0;
    update();
    return;
  }

}

function onPick(e) {
  const pick = e.target.closest('[data-pick]');
  if (!pick) return;
  const id = pick.dataset.pick;
  const on = !state.picked.has(id);
  if (on) state.picked.add(id);
  else state.picked.delete(id);

  // Patch the card in place instead of re-rendering the grid, so rapid
  // clicking and keyboard focus both survive.
  const card = pick.closest('.waste-card');
  card.dataset.picked = String(on);
  pick.textContent = on ? 'Remove from plan' : 'Add to plan';
  const top = card.querySelector('.wc-top');
  const pill = top.querySelector('.pill.pick');
  if (on && !pill) top.insertAdjacentHTML('beforeend', '<span class="pill pick">In plan</span>');
  if (!on && pill) pill.remove();

  renderPlan(state.model);
  save();
}

/* ───────────────────────── render ───────────────────────── */

let coachIntroEl = null;
let coachStarted = false;

function update() {
  const m = computeModel(state.profile, state.prices);
  state.model = m;
  syncVisibility();

  renderHero(m);
  renderReceipt(m);
  renderLedger(m);
  renderWaste(m);
  renderPlan(m);
  renderPrices(m);
  renderNumbers(m);
  if (coachIntroEl && !coachStarted) coachIntroEl.innerHTML = localAnswer('summary', m);
  save();
}

function renderHero(m) {
  $('#stat-save-pct').textContent = f.pct(m.savedPct);
  $('#stat-saving').textContent = f.sek(m.savedSek);
  $('#stat-co2').textContent = f.kg(m.savedCo2);
}

function renderReceipt(m) {
  const p = state.profile;
  $('#receipt-sub').textContent = `${p.area} m² ${HOUSING[p.housing].label.toLowerCase()} · ${p.priceArea}`;
  $('#receipt-lines').innerHTML = m.base.rows.map((r) => `
    <li><span class="name">${r.label}</span><span class="fill"></span>
      <span class="val">${f.num(r.kwh)} kWh</span>
      <span class="val">${f.num(r.sek)} kr</span></li>`).join('');
  $('#receipt-total').textContent = `${f.num(m.base.totalSek)} kr`;
  $('#receipt-waste').textContent = `− ${f.num(m.savedSek)} kr`;
  $('#receipt-foot').textContent = `${f.num(m.base.totalKwh)} kWh · ${f.num(m.base.totalCo2)} kg CO₂e per year · incl. VAT`;
}

function renderLedger(m) {
  $('#ledger').innerHTML = m.base.rows.map((r) => `
    <div class="ledger-row" data-id="${r.id}">
      <div class="ledger-name">${r.label}<small>${r.detail}</small></div>
      <div class="ledger-bar"><span style="width:${Math.max(1.5, r.share * 100).toFixed(1)}%"></span></div>
      <div class="ledger-kwh">${f.num(r.kwh)} kWh</div>
      <div class="ledger-sek">${f.num(r.sek)} kr</div>
    </div>`).join('');

  $('#ledger-kwh').textContent = f.kwh(m.base.totalKwh);
  $('#ledger-sek').textContent = f.sek(m.base.totalSek);
  $('#ledger-co2').textContent = f.kg(m.base.totalCo2);

  const biggest = m.base.rows.slice().sort((a, b) => b.kwh - a.kwh)[0];
  $('#breakdown-sub').textContent =
    `${biggest.label} is the biggest slice at ${f.pct(biggest.share)} — that is where a degree or a shorter shower is worth the most.`;
}

function renderWaste(m) {
  const grid = $('#waste-grid');
  if (!m.actions.length) {
    grid.innerHTML = `<p class="muted">Nothing major to fix. Your flat is already lean — keep the habits.</p>`;
    return;
  }
  grid.innerHTML = m.actions.map((a) => {
    const picked = state.picked.has(a.id);
    const kwh = a.kwh > 0 ? `${f.num(a.kwh)} kWh · ` : 'same kWh · ';
    const co2 = a.kwh > 0 ? `${f.kg(a.co2)} CO₂e` : 'no energy saved';
    const pb = a.payback
      ? (a.payback < 1 ? `pays back in ${Math.max(1, Math.round(a.payback * 12))} months` : `pays back in ${f.num(a.payback, 1)} yrs`)
      : '';
    return `
    <article class="waste-card" data-picked="${picked}">
      <div class="wc-top">
        <span class="pill">${a.category}</span>
        <span class="pill effort">${a.effort}</span>
        ${picked ? '<span class="pill pick">In plan</span>' : ''}
      </div>
      <h3>${esc(a.title)}</h3>
      <div class="wc-figure"><b>${f.sek(a.sek)}/yr</b>
        <span>${kwh}${co2}${pb ? ` · ${pb}` : ''}</span>
      </div>
      <div class="wc-spacer"></div>
      <details><summary>How</summary><ul>${a.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></details>
      <button class="pick-btn" type="button" data-pick="${a.id}">
        ${picked ? 'Remove from plan' : 'Add to plan'}
      </button>
    </article>`;
  }).join('');
}

function renderPlan(m) {
  const chosen = m.actions.filter((a) => state.picked.has(a.id));
  const sek = chosen.reduce((s, a) => s + a.sek, 0);
  const kwh = chosen.reduce((s, a) => s + a.kwh, 0);
  const co2 = chosen.reduce((s, a) => s + a.co2, 0);
  const share = m.savedSek ? Math.min(1, sek / m.savedSek) : 0;

  $('#plan-sek').textContent = f.sek(sek);
  $('#plan-meta').textContent = chosen.length
    ? `${chosen.length} of ${m.actions.length} fixes · ${f.num(kwh)} kWh · ${f.num(co2)} kg CO₂e a year`
    : 'nothing selected yet — tick the fixes you’ll actually do';
  $('#plan-fill').style.width = `${(share * 100).toFixed(0)}%`;
}

function renderPrices(m) {
  const pi = m.priceInfo;
  const now = pi ? pi.slots.find((s) => new Date(s.start) <= new Date() && new Date(s.end) > new Date()) || pi.slots[0] : null;
  $('#price-date').textContent = pi ? `${f.dayLabel(pi.date)} · ${pi.area} · ${pi.source === 'live' ? 'live spot' : 'bundled snapshot'}` : 'waiting for prices';
  $('#price-now').textContent = now ? `${f.price(now.sek)}` : '—';
  $('#price-badges').innerHTML = pi ? `
    <span class="pill">min ${f.price(pi.stats.min)}</span>
    <span class="pill">avg ${f.price(pi.stats.avg)}</span>
    <span class="pill">max ${f.price(pi.stats.max)}</span>` : '';

  $('#chart').innerHTML = pi ? priceChart(pi.slots, m.shift) : '';

  const s = m.shift;
  if (!s) {
    $('#shift-note').innerHTML = `
      <div><span>Shiftable today</span><strong>0 kWh</strong></div>
      <div><span>Why</span><span class="muted small">Add a dishwasher, washer or dryer to see timing savings.</span></div>`;
    return;
  }
  $('#shift-note').innerHTML = `
    <div><span>Cheapest 4 hours</span><strong>${f.clock(s.window.start)}–${f.clock(s.window.end)}</strong></div>
    <div><span>Peak vs cheap</span><strong>${f.num(s.peakPrice * 100, 1)} → ${f.num(s.cheapPrice * 100, 1)} öre</strong></div>
    <div><span>Worth per year</span><strong>${f.sek(s.sekYear)}</strong></div>
    <div><span>Load you can move</span><strong>${f.num(s.weekKwh, 1)} kWh/week</strong></div>`;
}

function priceChart(slots, shift) {
  const W = 1000, H = 250, pad = { l: 4, r: 4, t: 18, b: 26 };
  const n = slots.length;
  const vals = slots.map((s) => s.sek);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b);

  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M${pts.join('L')}`;
  const area = `${line}L${x(n - 1).toFixed(1)},${H - pad.b}L${x(0).toFixed(1)},${H - pad.b}Z`;

  let shade = '';
  if (shift) {
    const i0 = slots.findIndex((s) => s.start === shift.window.start);
    const count = Math.max(1, Math.round((new Date(shift.window.end) - new Date(shift.window.start)) / (new Date(slots[1].start) - new Date(slots[0].start))));
    if (i0 >= 0) {
      const x0 = x(i0); const x1 = x(Math.min(n - 1, i0 + count));
      shade = `<rect x="${x0}" y="${pad.t}" width="${Math.max(2, x1 - x0)}" height="${H - pad.t - pad.b}"
        fill="rgba(220,239,110,.55)"/>
        <text x="${(x0 + x1) / 2}" y="${pad.t - 5}" text-anchor="middle" font-size="10"
          font-family="SF Mono, Menlo, monospace" fill="#5d6b2c" letter-spacing="1">CHEAPEST</text>`;
    }
  }

  const ticks = [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => {
    const i = slots.findIndex((s) => new Date(s.start).getHours() === h && new Date(s.start).getMinutes() === 0);
    if (i < 0) return '';
    const major = h % 6 === 0;
    return `<line x1="${x(i)}" y1="${pad.t}" x2="${x(i)}" y2="${H - pad.b}"
      stroke="${major ? 'rgba(20,21,15,.12)' : 'rgba(20,21,15,.05)'}" stroke-width="1"/>
      <text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10"
        font-family="SF Mono, Menlo, monospace" fill="#6c675b">${String(h).padStart(2, '0')}</text>`;
  }).join('');

  const nowSlot = slots.findIndex((s) => new Date(s.start) <= new Date() && new Date(s.end) > new Date());
  let marker = '';
  if (nowSlot >= 0) {
    marker = `<line x1="${x(nowSlot)}" y1="${pad.t}" x2="${x(nowSlot)}" y2="${H - pad.b}"
      stroke="#cf4f2b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="${x(nowSlot)}" cy="${y(vals[nowSlot])}" r="3.5" fill="#cf4f2b"/>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Spot price curve for today">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#123a31" stop-opacity=".16"/>
      <stop offset="100%" stop-color="#123a31" stop-opacity="0"/>
    </linearGradient></defs>
    ${ticks}
    ${shade}
    <path d="${area}" fill="url(#pg)"/>
    <path d="${line}" fill="none" stroke="#123a31" stroke-width="2" stroke-linejoin="round"/>
    ${marker}
  </svg>`;
}

function renderNumbers(m) {
  const rows = m.actions;
  $('#savings-table tbody').innerHTML = rows.length
    ? rows.map((a) => `<tr><td>${esc(a.title)}</td>
        <td class="r">${f.num(a.kwh)}</td>
        <td class="r">${f.num(a.sek)}</td>
        <td class="r">${f.num(a.co2)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="muted">No waste detected.</td></tr>';

  $('#sum-kwh').textContent = f.num(m.savedKwh);
  $('#sum-sek').textContent = f.num(m.savedSek);
  $('#sum-co2').textContent = f.num(m.savedCo2);

  const p = state.profile;
  $('#assumption-line').textContent =
    `Based on ${p.area} m², ${p.people} ${p.people > 1 ? 'people' : 'person'}, ${HEATING_TYPES[p.heating].label.toLowerCase()}, ${p.priceArea}, `
    + `${p.showerMin} min showers, ${p.indoorTemp} °C indoors. Electricity ${f.price(m.base.elecPrice)}, heat ${f.price(m.base.heatPrice)}.`;

  $('#sources').innerHTML = SOURCES.map((s) => `
    <li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>
      <small>${esc(s.usedFor)}</small></li>`).join('');

  $('#co2-elec').value = p.co2.electricity;
  $('#co2-dist').value = p.co2.district;
}

/* ───────────────────────── prices ───────────────────────── */

async function refreshPrices() {
  const tag = $('#live-tag');
  tag.className = 'tag';
  $('#live-text').textContent = 'loading prices…';
  try {
    state.prices = await loadPrices(state.profile.priceArea);
    const pi = state.prices;
    const now = pi.slots.find((s) => new Date(s.start) <= new Date() && new Date(s.end) > new Date()) || pi.slots[0];
    tag.className = `tag ${pi.source}`;
    $('#live-text').textContent = `${pi.area} spot ${f.price(now.sek)}${pi.source === 'snapshot' ? ' · offline' : ''}`;
  } catch {
    state.prices = null;
    tag.className = 'tag snapshot';
    $('#live-text').textContent = 'prices unavailable';
  }
  update();
}

/* ───────────────────────── coach ───────────────────────── */

function bubble(html, who = 'bot', scroll = false) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  el.innerHTML = html;
  $('#chat').appendChild(el);
  if (scroll) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return el;
}

const SUGGESTIONS = [
  'Why is my bill so high?',
  'What should I do first?',
  'Is my shower expensive?',
  'When is electricity cheap?',
];

function renderCoachIntro() {
  $('#coach-chips').innerHTML = SUGGESTIONS
    .map((q) => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  coachIntroEl = bubble(localAnswer('summary', state.model));
}

async function ask(question) {
  if (!question.trim() || !state.model) return;
  coachStarted = true;
  bubble(esc(question), 'me', true);
  const thinking = bubble('<span class="muted">thinking…</span>', 'bot', true);

  const cfg = state.ai;
  if (cfg.key) {
    try {
      const text = await askLLM(question, state.model, state.profile, cfg);
      thinking.innerHTML = esc(text).replace(/\n/g, '<br>');
      return;
    } catch (err) {
      thinking.innerHTML = `${esc(localAnswer(question, state.model))}
        <br><small class="muted">(LLM unavailable: ${esc(err.message)})</small>`;
      return;
    }
  }
  thinking.innerHTML = localAnswer(question, state.model);
}

function bindCoach() {
  $('#ask-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#ask-input');
    ask(input.value);
    input.value = '';
  });
  $('#coach-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-q]');
    if (chip) ask(chip.dataset.q);
  });

  const base = $('#ai-base');
  const model = $('#ai-model');
  const key = $('#ai-key');
  base.value = state.ai.base || '';
  model.value = state.ai.model || '';
  key.value = state.ai.key || '';
  const persist = () => {
    state.ai = { base: base.value.trim(), model: model.value.trim(), key: key.value.trim() };
    localStorage.setItem('wattkoll.ai', JSON.stringify(state.ai));
    $('#ai-status').textContent = state.ai.key
      ? 'LLM answers on. Numbers still come from the local model.'
      : 'No key set — the built-in answers are used.';
  };
  [base, model, key].forEach((el) => el.addEventListener('change', persist));
  $('#ai-status').textContent = state.ai.key
    ? 'LLM answers on. Numbers still come from the local model.'
    : 'No key set — the built-in answers are used.';
}

/* ───────────────────────── init ───────────────────────── */

function bindNumbers() {
  $('#co2-elec').addEventListener('change', (e) => {
    state.profile.co2 = { ...state.profile.co2, electricity: Number(e.target.value) || 0 };
    update();
  });
  $('#co2-dist').addEventListener('change', (e) => {
    state.profile.co2 = { ...state.profile.co2, district: Number(e.target.value) || 0 };
    update();
  });
}

function init() {
  $('#setup-form').innerHTML = buildForm();
  const form = $('#setup-form');
  form.addEventListener('input', onFormInput);
  form.addEventListener('change', onFormInput);
  form.addEventListener('click', onFormClick);

  bindNumbers();
  bindCoach();
  document.addEventListener('click', onPick);
  syncVisibility();
  update();
  renderCoachIntro();
  refreshPrices();
}

init();
