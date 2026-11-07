const SNAPSHOT = './data/prices-snapshot.json';

function normalise(data, source) {
  const slots = data.slots?.length
    ? data.slots
    : (Array.isArray(data) ? data.map((x) => ({
        start: x.time_start, end: x.time_end, sek: x.SEK_per_kWh,
      })) : []);
  const v = slots.map((s) => s.sek);
  return {
    area: data.area,
    date: data.date,
    source,
    slots,
    stats: {
      min: Math.min(...v),
      max: Math.max(...v),
      avg: v.reduce((a, b) => a + b, 0) / v.length,
    },
  };
}

let snapshotCache = null;

async function fromSnapshot(area) {
  if (!snapshotCache) {
    const res = await fetch(SNAPSHOT, { cache: 'no-store' });
    if (!res.ok) throw new Error('no snapshot');
    snapshotCache = await res.json();
  }
  const data = snapshotCache[area] ?? snapshotCache.SE3;
  return data ? normalise(data, 'snapshot') : null;
}

/** Live prices through the local proxy; bundled snapshot when offline. */
export async function loadPrices(area) {
  try {
    const res = await fetch(`./api/prices?area=${encodeURIComponent(area)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return normalise(data, 'live');
  } catch (err) {
    console.warn('wattkoll: live prices unavailable —', err?.message || err);
    const snap = await fromSnapshot(area);
    if (!snap) throw err;
    return snap;
  }
}
