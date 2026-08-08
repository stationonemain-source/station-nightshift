"""Builds a static 1200x630 OG/share-preview image from the live parallax hero
layers (media/hero/far.webp, mid.webp, near.webp) + the current headline copy,
so the link-share preview matches what's actually on the site instead of the
old media/light/herolight.jpg asset from before the parallax hero shipped.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

BASE = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.join(BASE, "media", "hero")
OUT = os.path.join(BASE, "media", "og")
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630
BG = (245, 244, 241)       # --bg
INK = (29, 29, 31)         # --ink
MUTED = (107, 107, 112)    # --muted approx

canvas = Image.new("RGB", (W, H), BG)

def load_layer(name):
    return Image.open(os.path.join(HERO, f"{name}.webp")).convert("RGBA")

def place(layer_name, width_pct, left_pct, bottom_pct):
    img = load_layer(layer_name)
    scaled_w = int(W * width_pct)
    scaled_h = int(img.height * (scaled_w / img.width))
    img = img.resize((scaled_w, scaled_h), Image.LANCZOS)
    x = int(W * left_pct)
    bottom_y = H - int(H * bottom_pct)
    y = bottom_y - scaled_h
    canvas.paste(img, (x, y), img)

# same width/left/bottom ratios as .parallax__layer-img.pl-1 / .pl-2 / .pl-4 in v5.css
place("far", 1.32, -0.16, 0.30)
place("mid", 1.18, -0.09, 0.06)
place("near", 1.08, -0.04, -0.02)

# bottom fade into bg, matching .parallax__fade
fade_h = int(H * 0.30)
fade = Image.new("L", (W, fade_h), 0)
fdraw = ImageDraw.Draw(fade)
for i in range(fade_h):
    a = int(255 * (i / fade_h) ** 1.4)
    fdraw.line([(0, i), (W, i)], fill=a)
bg_fade = Image.new("RGB", (W, fade_h), BG)
canvas.paste(bg_fade, (0, H - fade_h), fade)

# soft scrim behind the text block so the headline stays legible regardless
# of which part of the mountain art falls behind it (site uses --fd: Inter,
# a sans — not a serif — so Segoe UI stands in as the closest system match)
scrim_h = 300
scrim = Image.new("L", (W, scrim_h), 0)
sdraw = ImageDraw.Draw(scrim)
for i in range(scrim_h):
    a = int(235 * max(0.0, 1 - (i / scrim_h) ** 1.6))
    sdraw.line([(0, i), (W, i)], fill=a)
scrim = scrim.filter(ImageFilter.GaussianBlur(2))
bg_scrim = Image.new("RGB", (W, scrim_h), BG)
canvas.paste(bg_scrim, (0, 0), scrim)

draw = ImageDraw.Draw(canvas)

f_word = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 20)
f_kicker = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 15)
f_head = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 52)
f_sub = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 20)

def tracked(draw, xy, text, font, fill, tracking=0, anchor_center_x=None):
    if anchor_center_x is not None:
        total = sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking
        x = anchor_center_x - total / 2
    else:
        x = xy[0]
    y = xy[1]
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking

# wordmark, top-left, matches nav "STATION" lockup
tracked(draw, (40, 34), "STATION", f_word, INK, tracking=3)

cx = W // 2
tracked(draw, (0, 96), "WELCOME TO STATION", f_kicker, MUTED, tracking=2.4, anchor_center_x=cx)

lines = ["The best way to staff", "your front office."]
y = 134
for line in lines:
    lw = draw.textlength(line, font=f_head)
    draw.text((cx - lw / 2, y), line, font=f_head, fill=INK)
    y += 66

sub = "Fourteen products that answer your calls, chase your leads, and get you paid."
sub_w = draw.textlength(sub, font=f_sub)
if sub_w > 980:
    sub = "Fourteen products that answer your calls and get you paid."
    sub_w = draw.textlength(sub, font=f_sub)
draw.text((cx - sub_w / 2, y + 6), sub, font=f_sub, fill=(90, 90, 94))

out_path = os.path.join(OUT, "hero-share.jpg")
canvas.convert("RGB").save(out_path, quality=90)
print("wrote", out_path, canvas.size)
