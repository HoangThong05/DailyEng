"""Vẽ ảnh chia sẻ (Open Graph) 1200x630 cho DailyEng.

Chạy:  python scripts/render-og.py
Cần:   Pillow, và font Segoe UI của Windows (có sẵn).

Kết quả: app/opengraph-image.png — Next tự gắn vào thẻ og:image cho mọi trang.
"""

from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630

BG_TOP = (8, 21, 26)
BG_BOTTOM = (12, 46, 48)
TEAL = (45, 212, 191)
WHITE = (240, 250, 249)
MUTED = (148, 173, 170)

FONT_DIR = r"C:\Windows\Fonts"
black = ImageFont.truetype(os.path.join(FONT_DIR, "seguibl.ttf"), 78)
bold = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 34)
regular = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 30)
small = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 26)

img = Image.new("RGB", (W, H), BG_TOP)
draw = ImageDraw.Draw(img)

# Nền chuyển màu chéo từ xanh đen sang xanh ngọc đậm.
for y in range(H):
    t = y / H
    draw.line(
        [(0, y), (W, y)],
        fill=tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)),
    )

# Quầng sáng ngọc phía sau con vịt.
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse([700, 90, 1180, 570], fill=(45, 212, 191, 46))
img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0, 0))

# Vịt bên phải.
duck = Image.open(os.path.join(ROOT, "public", "mascot", "vit-hero.png")).convert("RGBA")
duck = duck.crop(duck.getbbox())
side = 470
duck = duck.resize((side, int(side * duck.height / duck.width)), Image.LANCZOS)
img.paste(duck, (700, (H - duck.height) // 2), duck)

# Chữ bên trái.
x = 80
draw.text((x, 118), "DailyEng", font=black, fill=WHITE)
draw.text((x, 214), "Học tiếng Anh mỗi ngày", font=bold, fill=TEAL)
draw.text((x, 272), "Từ vựng · nghe · nói · luyện thi TOEIC", font=regular, fill=MUTED)

# Ba con số nổi bật.
stats = [("36", "bộ từ"), ("3.300+", "từ vựng"), ("0đ", "miễn phí")]
bx = x
for value, label in stats:
    w = draw.textlength(value, font=bold)
    draw.rounded_rectangle([bx, 350, bx + max(w + 44, 150), 424], radius=20, fill=(20, 58, 58))
    draw.text((bx + 22, 362), value, font=bold, fill=TEAL)
    draw.text((bx + 22, 398), label, font=small, fill=MUTED)
    bx += max(w + 44, 150) + 16

draw.text((x, 470), "daily-eng-omega.vercel.app", font=small, fill=MUTED)

out = os.path.join(ROOT, "app", "opengraph-image.png")
img.save(out, optimize=True)
print("saved", out, img.size)
