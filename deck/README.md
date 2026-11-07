# Wattkoll pitch deck — ~4 minutes

`Wattkoll-pitch.pptx` · 7 slides · 16:9 · speaker notes on every slide (notes pane
or Presenter View).

Built with the same visual language as the website: paper `#F5F1E8`, ink `#14150F`,
deep green `#123A31`, one electric lime `#DCEF6E`. Headlines Georgia, numbers
Consolas, body Calibri.

## Run of show

| # | Slide | Time | What it has to land |
|---|-------|------|---------------------|
| 1 | Your flat is leaking money | 0:00–0:30 | The receipt. Everyone recognises it and nobody understands it. |
| 2 | The bill is invisible | 0:30–1:10 | The person with agency has no feedback loop. |
| 3 | What one student can save | 1:10–1:55 | 1 240 kWh / 1 420 kr / 80 kg, plus the conservative case. |
| 4 | 100 000 student homes | 1:55–2:20 | Scale, with the honest caveat. |
| 5 | The student pays nothing | 2:20–3:05 | Operator is the buyer; 12 kr/home/month; pilot. |
| 6 | Three doors are open | 3:05–3:30 | Why now, and what the next 90 days look like. |
| 7 | Ask us for the demo | 3:30–3:50 | Email on screen for the Q&A. |

Demo, price curve and the coach live in the product, not in the deck — walk them
live if the room allows, otherwise the site's receipt carries the story.

## Rebuild

```bash
python3 build.py          # needs python-pptx
```

Slides are generated from `build.py`; edit copy there rather than in PowerPoint so
the deck stays reproducible. Images live in `images/` (`hero-crop.png` is cropped
from the live site).
