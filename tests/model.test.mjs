import test from 'node:test';
import assert from 'node:assert/strict';
import {
  baseline, computeModel, normalizeProfile, electricityPrice, cheapestBlock, shiftEstimate,
} from '../src/model.js';

const P = (over = {}) => normalizeProfile(over);

test('profile defaults are complete', () => {
  const p = P();
  assert.equal(p.area, 22);
  assert.equal(p.people, 1);
  assert.ok(p.co2.electricity > 0);
  assert.ok(p.appliances.fridge >= 1);
  assert.equal(typeof p.flags.blockedRadiators, 'boolean');
});

test('baseline rows add up to the totals', () => {
  const b = baseline(P(), 1.0);
  const kwh = b.rows.reduce((s, r) => s + r.kwh, 0);
  const sek = b.rows.reduce((s, r) => s + r.sek, 0);
  assert.ok(Math.abs(kwh - b.totalKwh) <= 3, `kWh drift ${kwh} vs ${b.totalKwh}`);
  assert.ok(Math.abs(sek - b.totalSek) <= 5, `SEK drift ${sek} vs ${b.totalSek}`);
  const shares = b.rows.reduce((s, r) => s + r.share, 0);
  assert.ok(Math.abs(shares - 1) < 0.01);
});

test('district heating uses the district price, electric uses electricity', () => {
  const p = P({ tariff: { type: 'fixed', fixed: 2.0 } });
  const b = baseline(p, 1.0);
  assert.equal(b.heatPrice, p.districtPrice);

  const e = baseline(P({ heating: 'electric', tariff: { type: 'fixed', fixed: 2.0 } }), 1.0);
  assert.equal(e.heatPrice, 2.0);
});

test('fixed tariff ignores the spot price', () => {
  const p = P({ tariff: { type: 'fixed', fixed: 1.4 } });
  assert.equal(electricityPrice(p, 5), 1.4);
});

test('a colder flat saves less, a bigger flat costs more', () => {
  const warm = computeModel(P({ indoorTemp: 23 }), null);
  const warmSave = warm.actions.find((a) => a.id === 'heating_setback').sek;
  const cool = computeModel(P({ indoorTemp: 21 }), null);
  const coolSave = cool.actions.find((a) => a.id === 'heating_setback').sek;
  assert.ok(warmSave > coolSave);

  const big = baseline(P({ area: 44 }), 1);
  const small = baseline(P({ area: 22 }), 1);
  assert.ok(big.heatingKwh > small.heatingKwh * 1.9);
});

test('heating advice never claims more than 35% of heating', () => {
  const m = computeModel(P({
    indoorTemp: 24,
    flags: { blockedRadiators: true, windowOpenHeating: true, draftyWindows: true },
  }), null);
  const heatingSaves = m.actions
    .filter((a) => a.id.startsWith('heating_'))
    .reduce((s, a) => s + a.kwh, 0);
  assert.ok(heatingSaves <= m.base.heatingKwh * 0.35 + 1);
});

test('every action saves something and the list is ranked', () => {
  const m = computeModel(P(), null);
  assert.ok(m.actions.length >= 3);
  for (const a of m.actions) assert.ok(a.sek > 0 && a.kwh >= 0);
  const sek = m.actions.map((a) => a.sek);
  assert.deepEqual(sek, [...sek].sort((x, y) => y - x));
  assert.equal(m.savedKwh, m.actions.reduce((s, a) => s + a.kwh, 0));
});

test('shower savings scale with how long the shower is', () => {
  const short = computeModel(P({ showerMin: 6 }), null).actions.find((a) => a.id === 'hot_water_shower');
  const long = computeModel(P({ showerMin: 15 }), null).actions.find((a) => a.id === 'hot_water_shower');
  assert.ok(long.sek > short.sek);
  const hot = computeModel(P({ showerMin: 15 }), null).base.hotWaterKwh;
  assert.ok(long.kwh < hot);
});

test('no people, no hot water', () => {
  const b = baseline(P({ people: 0 }), 1);
  assert.equal(Math.round(b.hotWaterKwh), 0);
});

test('cheapest block finds the low-price window', () => {
  const slots = Array.from({ length: 24 }, (_, h) => ({
    start: `2026-11-07T${String(h).padStart(2, '0')}:00:00+01:00`,
    end: `2026-11-07T${String((h + 1) % 24).padStart(2, '0')}:00:00+01:00`,
    sek: h >= 2 && h < 6 ? 0.1 : 1 + h / 100,
  }));
  const block = cheapestBlock(slots, 4);
  assert.equal(new Date(block.start).getHours(), 2);
  assert.ok(Math.abs(block.mean - 0.1) < 1e-9);
});

test('load shifting saves money only when the curve has a spread', () => {
  const flat = Array.from({ length: 24 }, (_, h) => ({
    start: `2026-11-07T${String(h).padStart(2, '0')}:00:00+01:00`,
    end: `2026-11-07T${String((h + 1) % 24).padStart(2, '0')}:00:00+01:00`,
    sek: 1,
  }));
  const p = P({ appliances: { dishwasher: 1, washer: 1 } });
  const none = shiftEstimate(p, { slots: flat, stats: { avg: 1 } });
  assert.equal(none.sekYear, 0);

  const spiky = flat.map((s, i) => ({ ...s, sek: i >= 17 && i < 21 ? 2 : 0.5 }));
  const good = shiftEstimate(p, { slots: spiky, stats: { avg: 1 } });
  assert.ok(good.sekYear > 100);
});

test('carbon follows the factors', () => {
  const p = P({ co2: { electricity: 100, district: 0 }, heating: 'electric' });
  const m = computeModel(p, null);
  const row = m.base.rows.find((r) => r.id === 'appliances');
  assert.ok(Math.abs(row.co2 - row.kwh * 100 / 1000) < 1.5);
  assert.equal(m.base.totalCo2 > 0, true);
});
