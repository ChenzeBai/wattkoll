// Static reference data and assumptions. Everything the model needs to explain
// itself lives here, so the UI and the docs never drift apart.

export const CO2 = {
  // gCO2e per kWh. Consumption-based estimates for Sweden. Both are editable
  // in the UI ("the numbers" panel) because they move year to year.
  electricity: 40,
  district: 70,
};

export const HEATING_TYPES = {
  district: {
    label: 'District heating',
    short: 'Fjärrvärme',
    usefulKwhPerM2: 90,
    eff: 0.95,          // billed energy / useful heat
    hotWaterEff: 1.0,   // billed as delivered hot water
    priceKind: 'district',
  },
  electric: {
    label: 'Direct electric',
    short: 'Direktel',
    usefulKwhPerM2: 90,
    eff: 1.0,
    hotWaterEff: 0.9,   // boiler losses
    priceKind: 'electric',
  },
  heatpump: {
    label: 'Heat pump',
    short: 'Värmepump',
    usefulKwhPerM2: 90,
    eff: 2.8,           // seasonal COP
    hotWaterEff: 2.5,
    priceKind: 'electric',
  },
};

export const HOT_WATER = {
  showerLpm: 9,        // litres per minute at the mixer
  deltaT: 50,          // 10 °C cold water -> 60 °C tank
  extraUse: 1.15,      // taps, cleaning, cooking on top of showers
};

export const PRICE_AREAS = {
  SE1: { label: 'SE1 · Luleå', city: 'Luleå' },
  SE2: { label: 'SE2 · Sundsvall', city: 'Sundsvall' },
  SE3: { label: 'SE3 · Stockholm', city: 'Stockholm' },
  SE4: { label: 'SE4 · Malmö', city: 'Malmö' },
};

// Annual kWh for one appliance, typical Swedish student use.
// Based on Energimyndigheten's household appliance figures, rounded to
// something a student flat actually sees.
export const APPLIANCES = [
  { id: 'fridge',      label: 'Fridge',            kwh: 180, w: 60,   standbyW: 0,  group: 'kitchen' },
  { id: 'freezer',     label: 'Freezer',           kwh: 280, w: 90,   standbyW: 0,  group: 'kitchen' },
  { id: 'stove',       label: 'Hob & oven',        kwh: 240, w: 2000, standbyW: 0,  group: 'kitchen' },
  { id: 'microwave',   label: 'Microwave',         kwh: 45,  w: 1000, standbyW: 2,  group: 'kitchen' },
  { id: 'kettle',      label: 'Kettle',            kwh: 40,  w: 2000, standbyW: 0,  group: 'kitchen' },
  { id: 'dishwasher',  label: 'Dishwasher',        kwh: 220, w: 1200, standbyW: 1,  group: 'kitchen', shiftable: true },
  { id: 'washer',      label: 'Washing machine',   kwh: 130, w: 500,  standbyW: 1,  group: 'laundry', shiftable: true },
  { id: 'dryer',       label: 'Tumble dryer',      kwh: 250, w: 2500, standbyW: 0,  group: 'laundry', shiftable: true },
  { id: 'tv',          label: 'TV',                kwh: 90,  w: 100,  standbyW: 3,  group: 'living' },
  { id: 'console',     label: 'Games console',     kwh: 90,  w: 120,  standbyW: 8,  group: 'living' },
  { id: 'pc',          label: 'Laptop & monitor',  kwh: 60,  w: 80,   standbyW: 4,  group: 'living' },
  { id: 'router',      label: 'Router (always on)',kwh: 70,  w: 8,    standbyW: 0,  group: 'living', alwaysOn: true },
  { id: 'speaker',     label: 'Smart speaker',     kwh: 25,  w: 5,    standbyW: 3,  group: 'living' },
];

export const BULBS = {
  led:        { label: 'LED',          w: 8 },
  halogen:    { label: 'Halogen',      w: 40 },
  incandescent: { label: 'Old bulb',   w: 60 },
};

export const HOUSING = {
  corridor: { label: 'Corridor room', note: 'Your own room, shared kitchen & laundry', area: 22 },
  studio:   { label: 'Studio',        note: 'Your own kitchen and bathroom',            area: 32 },
  shared:   { label: 'Shared flat',   note: 'Split the bill with flatmates',            area: 60 },
};

// Text for each detected waste. Numbers are filled in by the model.
export const ACTIONS = {
  heating_setback: {
    title: 'Turn the heating down 1–2 °C',
    category: 'Heating',
    effort: '1 min',
    confidence: 0.8,
    how: [
      'Set the thermostat to 20 °C in the rooms you actually sit in.',
      'Put on a jumper first — 1 °C is worth about 5% of your heating.',
      'Don’t turn it off completely: cold walls cost more to reheat and risk mould.',
    ],
  },
  heating_blocked: {
    title: 'Free the radiators',
    category: 'Heating',
    effort: '10 min',
    confidence: 0.9,
    how: [
      'Move the sofa, bed or desk at least 30 cm away from the radiator.',
      'Take the drying rack off the radiator — it blocks the heat and adds moisture.',
      'Open curtains during the day, close them at night.',
    ],
  },
  heating_windows: {
    title: 'Stop heating the street',
    category: 'Heating',
    effort: '1 min',
    confidence: 0.7,
    how: [
      'Air for 5 minutes with the window wide open, then close it — don’t leave it ajar for hours.',
      'Turn the radiator down while the window is open.',
      'Report broken window seals to your landlord; it’s their cost, not yours.',
    ],
  },
  heating_drafts: {
    title: 'Seal the worst draughts',
    category: 'Heating',
    effort: '30 min',
    confidence: 0.6,
    upfront: 150,
    how: [
      'A 150 kr roll of draught strip around the balcony door pays for itself in a winter.',
      'Check letterboxes, kitchen fans and bathroom vents too.',
      'Landlord fix? Ask — seals are maintenance, not decoration.',
    ],
  },
  hot_water_shower: {
    title: 'Take a 5-minute shower',
    category: 'Hot water',
    effort: '1 min',
    confidence: 0.75,
    how: [
      'A shower costs roughly 3–5 kr in energy alone; half of it is hot water.',
      'Use a timer or a playlist — 5 minutes is one song and a bit.',
      'Turn the water off while you shampoo.',
    ],
  },
  standby: {
    title: 'Kill the standby load',
    category: 'Standby',
    effort: '10 min',
    confidence: 0.9,
    upfront: 120,
    how: [
      'One switchable power strip for TV, console and charger: off when you leave.',
      'Games consoles are the worst — 8 W asleep is 70 kWh a year.',
      'Router stays on. Everything else can sleep.',
    ],
  },
  lighting: {
    title: 'Swap the bulbs for LED',
    category: 'Lighting',
    effort: '15 min',
    confidence: 0.95,
    upfront: 120,
    how: [
      'A 60 W bulb becomes 8 W for the same light.',
      'Start with the lamp you leave on longest — usually the desk lamp.',
      'Keep the old bulbs for the landlord at move-out.',
    ],
  },
  fridge_temp: {
    title: 'Set the fridge to 5 °C',
    category: 'Appliances',
    effort: '1 min',
    confidence: 0.7,
    how: [
      '5 °C is cold enough; every degree colder costs about 5% more.',
      'Keep it away from the oven and out of direct sun.',
      'A full fridge holds the cold better than an empty one.',
    ],
  },
  dryer: {
    title: 'Air-dry instead of tumble-drying',
    category: 'Laundry',
    effort: '1 min',
    confidence: 0.8,
    how: [
      'A drying rack in the bathroom with the fan on beats 250 kWh a year.',
      'In winter, the extra moisture is a feature — dry air feels colder than it is.',
      'Only tumble-dry towels and bedding.',
    ],
  },
  price_shift: {
    title: 'Run machines at cheap hours',
    category: 'Timing',
    effort: '2 min',
    confidence: 0.85,
    how: [
      'Dishwasher, washer and dryer all have a delay-start button.',
      'Set them before bed; the cheap window is usually 00:00–06:00.',
      'Same kWh, smaller bill — and often a cleaner grid.',
    ],
  },
};

export const SOURCES = [
  {
    id: 'elprisetjustnu',
    label: 'Elpriset just nu — hourly/quarter-hourly Swedish spot prices (SE1–SE4)',
    url: 'https://www.elprisetjustnu.se/elpris-api',
    usedFor: 'Price curve, peak/cheap windows, per-kWh cost',
  },
  {
    id: 'energimyndigheten',
    label: 'Energimyndigheten — household electricity use and saving advice',
    url: 'https://www.energimyndigheten.se/energieffektivisering/hemmet/',
    usedFor: 'Appliance kWh, 5% per °C rule, standby figures',
  },
  {
    id: 'electricitymaps',
    label: 'Electricity Maps — carbon intensity of Swedish electricity',
    url: 'https://www.electricitymaps.com/data-portal/sweden',
    usedFor: '40 gCO₂e/kWh (consumption-based, editable)',
  },
  {
    id: 'stockholmexergi',
    label: 'Stockholm Exergi — district heating carbon intensity',
    url: 'https://www.stockholmexergi.se/',
    usedFor: '70 gCO₂e/kWh for district heating (editable)',
  },
  {
    id: 'smhi',
    label: 'SMHI — normal temperatures for Stockholm',
    url: 'https://www.smhi.se/',
    usedFor: 'Degree-day basis for the 90 kWh/m² heating demand',
  },
];

export const DEFAULT_PROFILE = {
  housing: 'corridor',
  area: 22,
  people: 1,
  heating: 'district',
  priceArea: 'SE3',
  tariff: { type: 'spot', markup: 0.35, fixed: 1.5 },
  districtPrice: 1.05,
  indoorTemp: 22,
  showerMin: 8,
  fridgeTemp: 3,
  bulbs: { count: 4, type: 'halogen', hours: 3 },
  appliances: {
    fridge: 1, freezer: 1, stove: 1, microwave: 1, kettle: 0, dishwasher: 0,
    washer: 1, dryer: 0, tv: 1, console: 0, pc: 1, router: 1, speaker: 0,
  },
  flags: {
    blockedRadiators: true,
    windowOpenHeating: false,
    draftyWindows: false,
  },
  co2: { ...CO2 },
};
