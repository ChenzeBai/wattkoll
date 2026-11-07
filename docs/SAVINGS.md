# The numbers: what one student can save

Pitch slide material. Everything here is reproducible from `src/model.js` — the
same functions the app runs — so the demo and the slide cannot disagree.

## The student we model

| Input | Value | Why |
| --- | --- | --- |
| Housing | Corridor room, 22 m² | The most common Swedish student home |
| People | 1 | — |
| Heating | District heating (Stockholm) | Typical for the student housing stock |
| Price area | SE3 | Stockholm |
| Contract | Spot + 0.35 kr/kWh grid & fees, +25% VAT | — |
| Indoor temperature | 22 °C | Most students run a degree or two warm |
| Shower | 8 min/day | — |
| Appliances | Fridge, freezer, hob, microwave, washer, TV, laptop, router | — |
| Lighting | 4 × halogen, 3 h/day | Pre-LED corridor rooms are still common |

**Baseline: 5,197 kWh · 6,152 kr · 323 kg CO₂e per year** (spot 0.90 kr/kWh,
a typical year rather than one cold day).

Space heating is 40% of the energy, hot water 34%, appliances 21%, lighting 3%,
standby 2%.

## Savings, per student per year

| Change | kWh | kr | kg CO₂e | Effort | Payback |
| --- | ---: | ---: | ---: | --- | --- |
| 8 → 5 minute showers | 658 | 691 | 46.1 | 1 min | immediate |
| Heating 22 → 20 °C | 208 | 219 | 14.6 | 1 min | immediate |
| Halogen → LED | 140 | 219 | 5.6 | 15 min | ~4 months |
| Free the radiators | 146 | 153 | 10.2 | 10 min | immediate |
| Kill standby | 79 | 124 | 3.2 | 10 min | ~1 year |
| Fridge 3 → 5 °C | 9 | 14 | 0.4 | 1 min | immediate |
| Run machines at cheap hours | 0 | ~200* | 0 | 2 min | immediate |
| **Full plan** | **1,240** | **1,420** | **80** | | |

\* Load shifting moves the same kWh to cheaper hours. Its value depends on the
day's spread: ~200 kr at today's SE3 curve, ~0 kr in a flat-price week. It is
counted separately from the kWh savings and excluded from the totals above.

## What to claim in the pitch

**Be conservative.** The full plan assumes a student does everything and keeps
doing it. A defensible expectation:

> A typical student can cut **≈700 kWh, ≈800 kr and ≈45 kg CO₂e a year** — about
> 14% of their energy bill — from three changes that take under 20 minutes in
> total (shorter showers, 2 °C cooler, LED bulbs).

That is the top three at 70% adoption and persistence.
At 100% adoption the number is 1,240 kWh / 1,420 kr / 80 kg (20–24% of the bill).

## Scale

If 100,000 Swedish student homes (the order of magnitude Studentbostadsföretagen
works with) did the full plan:

- **124 GWh** electricity and heat per year — roughly the annual use of 6,000
  detached houses.
- **142 MSEK** back in students' pockets, at ~1,400 kr each.
- **8,000 tonnes CO₂e**, about the annual emissions of 5,000 petrol cars.

The CO₂ number is modest because Swedish electricity is already very clean
(≈40 g/kWh). The honest sustainability case is *money and peak load first, carbon
second* — plus the fact that district heating (≈70 g/kWh) is where most of the
remaining emissions sit, which is why space heating and hot water lead the plan.

## Sources

| Claim | Source |
| --- | --- |
| 90 kWh/m² space heat demand, Stockholm multifamily | Energimyndigheten statistics; SMHI degree days |
| Appliance kWh/year, 5% heating per °C, standby watts | [Energimyndigheten — Hushåll](https://www.energimyndigheten.se/energieffektivisering/hemmet/) |
| Spot prices per area, 15-minute resolution | [elprisetjustnu.se API](https://www.elprisetjustnu.se/elpris-api) |
| 40 gCO₂e/kWh electricity (SE, consumption-based) | [Electricity Maps](https://www.electricitymaps.com/data-portal/sweden) |
| 70 gCO₂e/kWh district heating | [Stockholm Exergi](https://www.stockholmexergi.se/) |
| 100,000 student homes in Sweden | Studentbostadsföretagen (order of magnitude) |

## Sensitivity

- **Spot price ±30%** moves the kronor total by roughly ±20%, because heating and
  hot water are priced with district heating, not electricity.
- **Shower length** dominates the kWh savings: at 6 minutes instead of 8 the
  shower action drops from 658 to about 330 kWh.
- **Heating type** changes everything: direct electric heating roughly doubles
  the cost of space heating and triples the value of a degree; a heat pump cuts
  purchased heat by about 65%.
- **Participation** is the biggest uncertainty in the scale case — treat the
  100,000-home figure as an upper bound, not a forecast.

## Reproduce it

```bash
python3 server.py        # the app uses today's live prices
node --test              # model invariants
```

For the typical-year table above, run the model with a flat 0.90 kr/kWh spot
price (or open the app on a day when SE3 averages about that).
