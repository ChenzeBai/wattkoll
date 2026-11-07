"""Build the Wattkoll pitch deck (10 slides, ~5 minutes).

Design language is lifted from the product itself: warm paper, ink, deep green,
one electric lime, Georgia headlines, Consolas numbers.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from pathlib import Path

# ── tokens ────────────────────────────────────────────────────────────────
PAPER = RGBColor(0xF5, 0xF1, 0xE8)
PAPER2 = RGBColor(0xEC, 0xE6, 0xD8)
WHITE = RGBColor(0xFF, 0xFD, 0xF8)
INK = RGBColor(0x14, 0x15, 0x0F)
MUTED = RGBColor(0x5F, 0x5A, 0x4F)
LINE = RGBColor(0xDC, 0xD4, 0xC2)
GREEN = RGBColor(0x12, 0x3A, 0x31)
GREEN2 = RGBColor(0x1B, 0x52, 0x45)
LIME = RGBColor(0xDC, 0xEF, 0x6E)
CLAY = RGBColor(0xCF, 0x4F, 0x2B)
CLAY_SOFT = RGBColor(0xF7, 0xE4, 0xDB)
CREAM = RGBColor(0xF2, 0xEF, 0xE4)

HEAD = "Georgia"
BODY = "Calibri"
MONO = "Consolas"

W, H = 13.333, 7.5
M = 0.8

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
BLANK = prs.slide_layouts[6]


# ── helpers ───────────────────────────────────────────────────────────────
def slide(bg=PAPER):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, W, H, fill=bg)
    return s


def text(s, x, y, w, h, paras, anchor=MSO_ANCHOR.TOP):
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for side in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
        setattr(tf, side, 0)
    tf.clear()
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = p.get("align", PP_ALIGN.LEFT)
        para.line_spacing = p.get("line", 1.0)
        para.space_before = Pt(p.get("before", 0))
        para.space_after = Pt(p.get("after", 0))
        for r in p["runs"]:
            run = para.add_run()
            run.text = r["t"]
            run.font.name = r.get("font", BODY)
            run.font.size = Pt(r.get("size", 16))
            run.font.bold = r.get("bold", False)
            run.font.italic = r.get("italic", False)
            run.font.color.rgb = r.get("color", INK)
    return box


def rect(s, x, y, w, h, fill=None, line=None, lw=1.0, shape=MSO_SHAPE.RECTANGLE):
    shp = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.shadow.inherit = False
    style = shp._element.find(qn("p:style"))
    if style is not None:
        shp._element.remove(style)
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(lw)
    return shp


def rule(s, x, y, w, color=LINE, lw=1.0):
    return rect(s, x, y, w, 0.006, fill=color, lw=0)


def kicker(s, txt, color=CLAY, y=0.62):
    text(s, M, y, 9.0, 0.3, [{"runs": [{"t": txt.upper(), "font": MONO, "size": 10, "color": color}]}])


def page_no(s, n, color=MUTED):
    text(s, W - M - 0.8, H - 0.52, 0.8, 0.3,
         [{"runs": [{"t": f"{n:02d}", "font": MONO, "size": 9, "color": color}], "align": PP_ALIGN.RIGHT}])


def foot(s, txt, color=MUTED):
    text(s, M, H - 0.52, 8.0, 0.3, [{"runs": [{"t": txt, "font": MONO, "size": 8, "color": color}]}])


def notes(s, txt):
    s.notes_slide.notes_text_frame.text = txt


# ─────────────────────────────────────────────────────────────────────────
# 01 · cover
# ─────────────────────────────────────────────────────────────────────────
s = slide(GREEN)
text(s, M, 0.72, 7.4, 0.3,
     [{"runs": [{"t": "AI FOR ENERGY SAVING  ·  HACKATHON TRACK", "font": MONO, "size": 10, "color": LIME}]}])

text(s, M - 0.03, 1.36, 7.6, 3.2, [
    {"runs": [{"t": "Your flat is ", "font": HEAD, "size": 54, "color": CREAM}], "line": 1.02},
    {"runs": [{"t": "leaking money.", "font": HEAD, "size": 54, "color": CREAM}], "line": 1.02},
    {"runs": [{"t": "Let’s find it.", "font": HEAD, "size": 54, "color": LIME, "italic": True}], "line": 1.02},
])

text(s, M, 4.62, 5.5, 1.0, [{
    "runs": [{"t": "Wattkoll reads a student flat — size, habits, appliances, today’s spot price — "
                   "and turns it into a year of energy in kronor, with a plan that takes 20 minutes to finish.",
              "font": BODY, "size": 14, "color": CREAM}],
    "line": 1.35,
}])

rule(s, M, 6.28, 5.2, RGBColor(0x2C, 0x5A, 0x4E))

text(s, M, 6.45, 6.0, 0.6, [
    {"runs": [{"t": "cb224jw@student.lnu.se", "font": MONO, "size": 11, "color": LIME}], "line": 1.0},
    {"runs": [{"t": "Wattkoll  ·  built in 5 hours", "font": MONO, "size": 8, "color": RGBColor(0x8F, 0xA8, 0x9C)}],
     "line": 1.6},
])

# receipt card
RX, RY, RW, RH = 8.55, 1.02, 3.95, 5.42
rect(s, RX + 0.06, RY + 0.08, RW, RH, fill=RGBColor(0x0D, 0x2E, 0x27))
rect(s, RX, RY, RW, RH, fill=WHITE)

pad = 0.34
text(s, RX + pad, RY + 0.30, RW - 2 * pad, 0.35, [{
    "runs": [
        {"t": "Wattkoll", "font": HEAD, "size": 20, "color": INK},
        {"t": "    ANNUAL REPORT", "font": MONO, "size": 7, "color": MUTED},
    ]}])
rule(s, RX + pad, RY + 0.72, RW - 2 * pad, LINE)
text(s, RX + pad, RY + 0.86, RW - 2 * pad, 0.25,
     [{"runs": [{"t": "22 M² CORRIDOR ROOM  ·  SE3", "font": MONO, "size": 7.5, "color": MUTED}]}])

rows = [
    ("Space heating", "2 084 kWh", "2 188 kr"),
    ("Hot water", "1 755 kWh", "1 842 kr"),
    ("Appliances", "1 095 kWh", "2 746 kr"),
    ("Lighting", "175 kWh", "439 kr"),
    ("Standby", "88 kWh", "220 kr"),
]
y = RY + 1.24
for name, kwh, sek in rows:
    text(s, RX + pad, y, 1.42, 0.24, [{"runs": [{"t": name, "font": BODY, "size": 9.5, "color": INK}]}])
    text(s, RX + pad + 1.35, y, 1.08, 0.24,
         [{"runs": [{"t": kwh, "font": MONO, "size": 8.5, "color": MUTED}], "align": PP_ALIGN.RIGHT}])
    text(s, RX + RW - pad - 0.78, y, 0.78, 0.24,
         [{"runs": [{"t": sek, "font": MONO, "size": 8.5, "color": INK}], "align": PP_ALIGN.RIGHT}])
    y += 0.345

rule(s, RX + pad, RY + 3.14, RW - 2 * pad, INK)
text(s, RX + pad, RY + 3.26, 1.2, 0.3, [{"runs": [{"t": "TOTAL", "font": MONO, "size": 8, "color": MUTED}]}])
text(s, RX + 1.6, RY + 3.18, 1.9, 0.5,
     [{"runs": [{"t": "7 435 kr", "font": MONO, "size": 20, "color": INK}], "align": PP_ALIGN.RIGHT}])

rect(s, RX + pad, RY + 3.86, RW - 2 * pad, 0.56, fill=CLAY_SOFT)
text(s, RX + pad + 0.14, RY + 3.98, 1.6, 0.3,
     [{"runs": [{"t": "WASTE WE CAN FIND", "font": MONO, "size": 7.5, "color": RGBColor(0x7D, 0x2C, 0x14)}]}])
text(s, RX + 1.9, RY + 3.95, 1.55, 0.35,
     [{"runs": [{"t": "− 1 837 kr", "font": MONO, "size": 15, "color": RGBColor(0x7D, 0x2C, 0x14)}],
       "align": PP_ALIGN.RIGHT}])

text(s, RX + pad, RY + 4.66, RW - 2 * pad, 0.4,
     [{"runs": [{"t": "5 197 kWh  ·  323 kg CO₂e  ·  INCL. VAT", "font": MONO, "size": 7, "color": MUTED}]}])

notes(s, "Timing 0:00–0:30. Open with the receipt, not with the problem: every student has seen a "
         "bill like this and has no idea what is inside it. One sentence on what Wattkoll is, then move.")

# ─────────────────────────────────────────────────────────────────────────
# 02 · problem
# ─────────────────────────────────────────────────────────────────────────
s = slide(PAPER)
kicker(s, "01 · The problem")
text(s, M, 1.05, 9.6, 1.4, [{"runs": [{"t": "The bill is invisible.", "font": HEAD, "size": 46, "color": INK}]}])
text(s, M, 2.42, 7.9, 1.2, [{
    "runs": [{"t": "The meter is in the corridor. The bill is inside the rent. "
                   "The one person who decides how long the shower runs never sees a number.",
              "font": BODY, "size": 17, "color": MUTED}],
    "line": 1.45,
}])

rule(s, M, 3.62, 7.4, LINE)
text(s, M, 3.82, 10.0, 0.5, [{"runs": [{"t": "5 197 kWh a year. One line in the rent notice.",
                                        "font": HEAD, "size": 21, "color": INK, "italic": True}]}])

stats = [("40%", "of a student flat’s energy is space heating"),
         ("34%", "is hot water — the shower, not the gadgets"),
         ("0", "meters a student can actually read")]
for i, (n, label) in enumerate(stats):
    x = M + i * 3.95
    rule(s, x, 4.92, 3.5, LINE)
    text(s, x, 5.08, 3.5, 0.7, [{"runs": [{"t": n, "font": MONO, "size": 40, "color": CLAY}]}])
    text(s, x, 5.82, 3.2, 0.9, [{"runs": [{"t": label, "font": BODY, "size": 13, "color": MUTED}], "line": 1.3}])

foot(s, "Wattkoll model · 22 m² corridor room, district heating, SE3")
page_no(s, 2)
notes(s, "Timing 0:30–1:10. The point is not that energy is expensive, it is that the person "
         "with the agency has no feedback loop. Landlords have the meters; students have the shower.")

# ─────────────────────────────────────────────────────────────────────────
# 06 · savings
# ─────────────────────────────────────────────────────────────────────────
s = slide(PAPER)
kicker(s, "02 · The sustainability case")
text(s, M, 0.98, 10.8, 0.7, [{"runs": [{"t": "What one student can save, per year.", "font": HEAD, "size": 36, "color": INK}]}])

nums = [("1 240", "kWh", "of 5 197 — a quarter of the energy"), ("1 420", "kr", "of a 6 152 kr annual bill"),
        ("80", "kg CO₂e", "of 323 — Swedish power is already clean")]
for i, (n, unit, label) in enumerate(nums):
    x = M + i * 3.95
    rule(s, x, 2.02, 3.5, INK, 1.4)
    text(s, x, 2.18, 3.3, 0.8, [{"runs": [{"t": n, "font": MONO, "size": 42, "color": CLAY}]}])
    text(s, x, 2.98, 3.3, 0.3, [{"runs": [{"t": unit, "font": MONO, "size": 11, "color": MUTED}]}])
    text(s, x, 3.32, 3.2, 0.6, [{"runs": [{"t": label, "font": BODY, "size": 11, "color": MUTED}], "line": 1.25}])

rule(s, M, 4.22, W - 2 * M, LINE)

text(s, M, 4.38, 2.6, 0.3, [{"runs": [{"t": "THE TOP THREE", "font": MONO, "size": 8, "color": MUTED}]}])
top = [("8 → 5 minute showers", "658 kWh", "691 kr"),
       ("22 → 20 °C indoors", "208 kWh", "219 kr"),
       ("Halogen → LED", "140 kWh", "352 kr")]
yy = 4.7
for name, kwh, sek in top:
    text(s, M, yy, 4.2, 0.28, [{"runs": [{"t": name, "font": BODY, "size": 12, "color": INK}]}])
    text(s, M + 4.3, yy, 1.2, 0.28, [{"runs": [{"t": kwh, "font": MONO, "size": 11, "color": MUTED}]}])
    text(s, M + 5.5, yy, 1.0, 0.28, [{"runs": [{"t": sek, "font": MONO, "size": 11, "color": INK}]}])
    yy += 0.4

text(s, 7.1, 4.38, 5.4, 0.3, [{"runs": [{"t": "CONSERVATIVE CASE", "font": MONO, "size": 8, "color": MUTED}]}])
text(s, 7.1, 4.7, 5.4, 1.4, [{
    "runs": [{"t": "Top three changes, 70% adoption and persistence: ≈700 kWh · ≈800 kr · ≈45 kg CO₂e — "
                   "about 14% of the bill, for under 20 minutes of work.",
              "font": BODY, "size": 12, "color": INK}],
    "line": 1.4,
}])

text(s, M, 6.42, 11.6, 0.5, [{
    "runs": [{"t": "Sources: Energimyndigheten (appliance kWh, 5%/°C) · elprisetjustnu.se (spot) · "
                   "Electricity Maps 40 g/kWh · Stockholm Exergi 70 g/kWh · typical-year spot 0.90 kr/kWh · table in docs/SAVINGS.md",
              "font": MONO, "size": 7.5, "color": MUTED}], "line": 1.3}])
page_no(s, 3)
notes(s, "Timing 1:10–1:55. Lead with the three numbers, then the conservative case — judges trust the "
         "smaller number more. Mention that the sources line is on the slide, not in an appendix.")

# ─────────────────────────────────────────────────────────────────────────
# 07 · scale
# ─────────────────────────────────────────────────────────────────────────
s = slide(GREEN)
text(s, M, 0.72, 8.0, 0.3,
     [{"runs": [{"t": "03  ·  THE SCALE", "font": MONO, "size": 10, "color": LIME}]}])
text(s, M, 1.28, 9.0, 1.3, [{"runs": [{"t": "100 000 student homes\ndo this.", "font": HEAD, "size": 44, "color": CREAM}],
                             "line": 1.06}])

scale = [("124", "GWh", "electricity and heat, per year"), ("142", "MSEK", "back in students’ pockets"),
         ("8 000", "tonnes", "CO₂e — five thousand petrol cars")]
for i, (n, unit, label) in enumerate(scale):
    x = M + i * 3.95
    rule(s, x, 3.62, 3.5, RGBColor(0x2C, 0x5A, 0x4E), 1.2)
    text(s, x, 3.78, 3.3, 0.8, [{"runs": [{"t": n, "font": MONO, "size": 38, "color": LIME}]}])
    text(s, x, 4.55, 3.3, 0.3, [{"runs": [{"t": unit, "font": MONO, "size": 11, "color": CREAM}]}])
    text(s, x, 4.9, 3.2, 0.6, [{"runs": [{"t": label, "font": BODY, "size": 11, "color": RGBColor(0x9F, 0xB5, 0xA8)}],
                                  "line": 1.25}])

text(s, M, 5.95, 8.4, 0.9, [{
    "runs": [{"t": "An upper bound at full adoption, not a forecast. The carbon number is modest because "
                   "Swedish electricity is already clean — which is exactly why heat and hot water lead the plan.",
              "font": BODY, "size": 11, "color": RGBColor(0x9F, 0xB5, 0xA8)}],
    "line": 1.45,
}])
page_no(s, 4, RGBColor(0x6E, 0x8A, 0x7C))
notes(s, "Timing 1:55–2:20. Do not oversell the carbon. The credible claim is money and peak load; "
         "the CO₂ number is a bonus from district heating.")

# ─────────────────────────────────────────────────────────────────────────
# 08 · business
# ─────────────────────────────────────────────────────────────────────────
s = slide(PAPER)
kicker(s, "04 · The business")
text(s, M, 1.0, 11.4, 1.2, [{
    "runs": [{"t": "The student pays nothing.\nThe landlord pays 12 kr a home, a month.", "font": HEAD, "size": 33,
              "color": INK}], "line": 1.12}])

cards = [
    ("STUDENT", "Free", ["40 seconds, no account", "A plan in kronor, not a lecture", "Nothing leaves the browser"]),
    ("OPERATOR", "144 kr / home / year", ["Measured kWh, before vs control group",
                                          "CSRD-ready engagement evidence", "A tenant app that isn’t a rent hike"]),
    ("WATTKOLL", "720 000 kr ARR", ["at 5 000 homes", "≈85% gross margin", "Pilot: 25 000 kr per building, one semester"]),
]
for i, (label, price, bullets) in enumerate(cards):
    x = M + i * 3.95
    rect(s, x, 3.15, 3.55, 2.0, fill=WHITE, line=LINE)
    text(s, x + 0.24, 3.32, 3.1, 0.25, [{"runs": [{"t": label, "font": MONO, "size": 8, "color": CLAY}]}])
    text(s, x + 0.24, 3.58, 3.1, 0.4, [{"runs": [{"t": price, "font": HEAD, "size": 19, "color": INK}]}])
    body = [{"runs": [{"t": b, "font": BODY, "size": 10, "color": MUTED}], "line": 1.2, "before": 2} for b in bullets]
    text(s, x + 0.24, 4.1, 3.05, 1.3, body)

text(s, M, 5.95, 11.5, 0.7, [{
    "runs": [{"t": "The landlord already owns the meters and the CSRD duty; we supply the behaviour layer. "
                   "One pilot building, measured against a control, then the portfolio.",
              "font": BODY, "size": 12, "color": MUTED}], "line": 1.35}])
page_no(s, 5)
notes(s, "Timing 2:20–3:05. Name the buyer explicitly — student housing operators, not students. "
         "The 12 kr price is small enough to fit an existing sustainability budget.")

# ─────────────────────────────────────────────────────────────────────────
# 09 · why now
# ─────────────────────────────────────────────────────────────────────────
s = slide(PAPER)
kicker(s, "05 · Why now")
text(s, M, 1.0, 10.5, 0.8, [{"runs": [{"t": "Three doors are open at once.", "font": HEAD, "size": 36, "color": INK}]}])

why = [("Prices swing", "SE3 moved from 1.08 to 2.50 kr/kWh inside one day. Timing advice is no longer a gimmick."),
       ("Reporting changed", "CSRD and the EED push landlords from kWh in a report to engagement they can prove."),
       ("The stock is renovating", "Heat pumps and individual metering are going in. The behaviour layer is still missing.")]
for i, (title, desc) in enumerate(why):
    x = M + i * 3.95
    rule(s, x, 2.2, 3.5, INK, 1.2)
    text(s, x, 2.36, 3.3, 0.35, [{"runs": [{"t": title, "font": HEAD, "size": 18, "color": INK}]}])
    text(s, x, 2.85, 3.25, 1.1, [{"runs": [{"t": desc, "font": BODY, "size": 11, "color": MUTED}], "line": 1.35}])

rule(s, M, 4.72, W - 2 * M, LINE)
text(s, M, 4.9, 3.0, 0.3, [{"runs": [{"t": "NEXT 90 DAYS", "font": MONO, "size": 8, "color": MUTED}]}])
nexts = [("Pilot", "1 000 homes, one operator, one semester"),
         ("Measure", "before/after kWh against a control group"),
         ("Convert", "portfolio contract + CSRD export")]
for i, (title, desc) in enumerate(nexts):
    x = M + i * 3.95
    text(s, x, 5.24, 3.3, 0.3, [{"runs": [{"t": f"{i+1}. {title}", "font": BODY, "size": 13, "color": INK, "bold": True}]}])
    text(s, x, 5.58, 3.25, 0.5, [{"runs": [{"t": desc, "font": BODY, "size": 11, "color": MUTED}]}])
page_no(s, 6)
notes(s, "Timing 3:05–3:30. Keep this fast: three reasons, three next steps. If time is short, skip the "
         "next-90-days row and go straight to the close.")

# ─────────────────────────────────────────────────────────────────────────
# 10 · close
# ─────────────────────────────────────────────────────────────────────────
s = slide(GREEN)
text(s, M, 1.2, 8.5, 0.3, [{"runs": [{"t": "THANK YOU", "font": MONO, "size": 10, "color": LIME}]}])
text(s, M, 1.72, 10.0, 1.6, [{"runs": [{"t": "Ask us for the demo.", "font": HEAD, "size": 52, "color": CREAM}]}])
text(s, M, 3.12, 8.6, 0.8, [{
    "runs": [{"t": "It runs in a browser tab, without a meter. We can show your building in it before the coffee is cold.",
              "font": BODY, "size": 15, "color": RGBColor(0xC9, 0xD6, 0xCC)}], "line": 1.4}])

text(s, M, 4.0, 8.0, 0.3, [{"runs": [{"t": "WRITE TO US", "font": MONO, "size": 8, "color": RGBColor(0x6E, 0x8A, 0x7C)}]}])
text(s, M, 4.22, 8.0, 0.45, [{"runs": [{"t": "cb224jw@student.lnu.se", "font": MONO, "size": 20, "color": LIME}]}])

recap = [("1 240", "kWh"), ("1 420", "kr"), ("80", "kg CO₂e")]
for i, (n, u) in enumerate(recap):
    x = M + i * 2.0
    text(s, x, 5.5, 1.9, 0.4, [{"runs": [{"t": n, "font": MONO, "size": 20, "color": CREAM}]}])
    text(s, x, 5.9, 1.9, 0.3, [{"runs": [{"t": u + " per student, per year", "font": BODY, "size": 9,
                                            "color": RGBColor(0x9F, 0xB5, 0xA8)}]}])

text(s, W - M - 3.2, 6.55, 3.2, 0.3, [{"runs": [{"t": "Wattkoll · AI for Energy Saving", "font": MONO, "size": 8,
                                                    "color": RGBColor(0x6E, 0x8A, 0x7C)}], "align": PP_ALIGN.RIGHT}])
notes(s, "Timing 3:30–3:50. Stop talking. Leave the email on screen for the Q&A.")

out = Path(__file__).parent / "Wattkoll-pitch.pptx"
prs.save(out)
print("saved", out, "slides:", len(prs.slides))
