# First business model

*Checkpoint 2 deliverable. Numbers are order-of-magnitude, with the assumptions
written down so a judge can knock them over.*

## One line

**Wattkoll is the energy coach inside student housing.** Students get a
personal plan that cuts their bill; the landlord gets measurable kWh reductions
and a sustainability story they can put in a report.

## The problem, in one paragraph

Students in Swedish student housing pay for electricity, heating and hot water
but never see where it goes — the meter is in the corridor, the bill is in the
rent, and the only feedback is a cold shower in January. Landlords have the
opposite problem: they own the meters, the kWh/m² targets and the CSRD reporting
duty, but no way to reach the 20-year-old who actually decides how long the
shower runs. Everyone has data; nobody has a conversation.

## Who pays

**Primary: student housing operators.** SSSB (Stockholm), SGS (Gothenburg), AF
Bostäder (Lund), KlaraBo, Heimstaden's student stock — roughly 100,000 student
homes in Sweden. They already spend money on metering and energy management, and
they are under pressure to show tenant engagement, not just boiler upgrades.

**Secondary: energy retailers and district heating suppliers**, who want
demand flexibility and lower churn among young customers. This is a later wedge,
not the first one.

**The student pays nothing.** That is the point: the person who changes behaviour
must not be the person who has to open a new account.

## Why now

1. **Price volatility is the new normal.** Spot prices in SE3 ranged from 1.08 to
   2.50 kr/kWh in a single day in this demo. Timing advice is worth real money.
2. **CSRD and the Energy Efficiency Directive** push landlords from reporting
   kWh to reporting *engagement* and verified savings.
3. **The stock is being renovated** (heat pumps, individual metering), and the
   behaviour layer is missing from those projects.

## Product

- A 40-second onboarding, no meter integration required.
- A ranked, quantified plan in kWh / kr / CO₂e — not a dashboard of graphs.
- Live price timing ("run the wash at 02:00, save 200 kr/year").
- A grounded AI coach that answers "why is my bill high?" in the student's own
  numbers.
- White-label: the operator's logo, their tariff, their district heating price,
  a QR code in the laundry room.

**Wedge:** one operator, one building, one semester. Prove the kWh delta, then
sell the portfolio.

## Pricing

| Plan | Price | What's included |
| --- | --- | --- |
| Pilot | 25,000 kr / building / semester | onboarding, co-branded app, before/after measurement |
| Portfolio | **12 kr per home per month** (144 kr/year) | app, dashboard, quarterly savings report, CSRD export |
| Savings share (alternative) | 25% of verified savings | for operators who prefer upside over a fixed fee |

At 12 kr/home/month, five thousand homes is 720,000 kr of ARR — small for a
landlord (about 0.2% of the rent roll) and easy to approve inside an existing
sustainability budget.

## Unit economics

Per 5,000-home portfolio, per year:

| Line | Amount |
| --- | ---: |
| Revenue | 720,000 kr |
| Hosting + LLM + support | ~110,000 kr |
| Gross margin | ~85% |
| Sales & pilot cost (amortised) | ~180,000 kr |
| Contribution | ~430,000 kr |

The marginal cost per additional home is close to zero; the cost that matters is
the integration work with each landlord's rent and metering setup.

## Value to the landlord

- **Energy:** a 5% reduction on a 5,000-home portfolio at ~7,000 kr of energy per
  home is ~1.75 MSEK a year. The product costs 0.7 MSEK.
- **Reporting:** CSRD-ready engagement and savings evidence, not just invoices.
- **Tenant relations:** something useful in the app instead of another rent hike.

## Go to market

1. **One pilot** with a mid-sized operator (2,000–5,000 homes) in Stockholm, one
   semester, free onboarding, paid measurement.
2. **Publish the delta** — kWh per home before/after, with the control group of
   non-participating buildings.
3. **Sell the portfolio** on the back of that number, starting with the operator's
   own sustainability report.
4. **Channel:** facility-management and metering vendors already sell into these
   landlords; revenue-share with them instead of building a sales team.

## Competition

| Who | What they do | Why we're different |
| --- | --- | --- |
| Eliq, Metry, Watty, Granlund | Building-level energy analytics for operators | They stop at the dashboard; nobody talks to the student |
| Tibber, Greenely | Consumer price apps | Optimised for homeowners with spot contracts and EV chargers, not corridor rooms |
| Landlord apps (SSSB, SGS) | Rent, laundry booking, notices | No energy content, no personalisation |
| Universities' sustainability offices | Campaigns, posters | No measurement, no follow-up |

The moat is distribution plus behavioural data: which nudges actually move kWh in
student housing, and what each action is worth in that building's tariff.

## Risks and how to kill them

| Risk | Mitigation |
| --- | --- |
| Students don't care | The value is in kronor, not CO₂; the plan is 20 minutes, not a lifestyle change |
| Landlord can't attribute savings | Per-home delta with a control group; also sell on engagement metrics |
| Heating is included in rent, so the student has no incentive | The operator is the buyer; the student gets comfort and a share of the savings |
| Privacy (personal data) | No meter data in v1; answers stay in the browser; GDPR-light by design |
| LLM cost or hallucination | Deterministic model owns every number; the LLM only writes prose |

## Twelve months

- **Q1:** pilot with one operator, 1,000 homes; instrument before/after.
- **Q2:** white-label SDK, district-heating price ingestion, Swedish + English.
- **Q3:** three portfolio contracts (~15,000 homes), CSRD export.
- **Q4:** second city, first retailer partnership for demand flexibility.

## What "good" looks like at the end of the pilot

1. 25%+ of invited students open the app; 10% complete the plan.
2. 5% measured reduction in kWh per participating home versus control.
3. Two of the three pilot operators convert to a paid portfolio.
