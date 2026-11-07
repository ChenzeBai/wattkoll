# Wattkoll pitch deck — 5 minutes

`Wattkoll-pitch.pptx` · 10 slides · 16:9 · speaker notes on every slide (open the
notes pane, or Presenter View).

Built with the same visual language as the website: paper `#F5F1E8`, ink `#14150F`,
deep green `#123A31`, one electric lime `#DCEF6E`. Headlines Georgia, numbers
Consolas, body Calibri.

## Run of show (5:00)

| # | Slide | Time | What it has to land |
|---|-------|------|---------------------|
| 1 | Your flat is leaking money | 0:00–0:25 | The receipt. Everyone recognises it and nobody understands it. |
| 2 | The bill is invisible | 0:25–1:00 | The person with agency has no feedback loop. |
| 3 | Nine answers in | 1:00–1:35 | 40 seconds in, a year out. No meter integration. |
| 4 | This is what the student sees | 1:35–2:20 | Live demo or the screenshot. Change the shower slider. |
| 5 | The model owns the number | 2:20–2:55 | 40% of the score is AI + design; be explicit about which part is which. |
| 6 | What one student can save | 2:55–3:35 | 1 240 kWh / 1 420 kr / 80 kg, plus the conservative case. |
| 7 | 100 000 student homes | 3:35–3:55 | Scale, with the honest caveat. |
| 8 | The student pays nothing | 3:55–4:25 | Operator is the buyer; 12 kr/home/month; pilot. |
| 9 | Three doors are open | 4:25–4:45 | Why now, and what the next 90 days look like. |
| 10 | Ask us for the demo | 4:45–5:00 | Email on screen for the Q&A. |

## If the hard stop is 4:00

The track brief says 4 minutes. Drop **slide 5** (keep the honesty line for Q&A
instead) and merge **slide 9** into the closing sentence — that lands at ~4:00.
The numbers on slide 6 are the ones you cannot cut.

## Rebuild

```bash
python3 build.py          # needs python-pptx
```

Slides are generated from `build.py`; edit copy there rather than in PowerPoint so
the deck stays reproducible. Images live in `images/` (`hero-crop.png` is cropped
from the live site).
