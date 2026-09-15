/**
 * Sinh bộ icon PNG/ICO của app từ ảnh linh vật public/mascot/vit-tot-nghiep.png.
 *
 * Chạy:  node scripts/render-icons.mjs
 * Cần:   Python + Pillow.
 *
 * Ảnh gốc là hình vuông bo góc trên nền trong suốt. Script cắt sát mép hình,
 * rồi:
 *   public/icon-512.png, icon-192.png   — giữ góc bo (icon PWA, favicon)
 *   public/icon-maskable-512.png        — tô nền xanh tràn viền, thu hình vào
 *                                         vùng an toàn để hệ điều hành tự cắt
 *   app/apple-icon.png (180)            — nền tràn viền, iOS tự bo góc
 *   app/icon.png (64), app/favicon.ico  — favicon: chỉ con vịt, không khung
 *                                         xanh (từ public/mascot/vit-tot-nghiep-trong.png,
 *                                         là ảnh gốc đã tách nền bằng flood-fill)
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const python = `
from PIL import Image
root = ${JSON.stringify(root)}

src = Image.open(f"{root}/public/mascot/vit-tot-nghiep.png").convert("RGBA")
src = src.crop(src.getbbox())
size = max(src.size)
# Canh giữa vào hình vuông (ảnh gốc có thể lệch vài pixel)
square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
square.paste(src, ((size - src.width) // 2, (size - src.height) // 2))

def rounded(px):
    return square.resize((px, px), Image.LANCZOS)

def flat(px, scale=1.0):
    """Nền tràn viền: dựng gradient dọc từ màu mép trái/phải của khung xanh
    (nền ảnh có gradient nhẹ nên tô một màu phẳng sẽ lộ viền ô), rồi đặt hình
    sắc nét lên trên."""
    w, h = square.size
    rows = []
    for y in range(h):
        samples = []
        for x in (int(w * 0.04), int(w * 0.96)):
            r, g, b, a = square.getpixel((x, y))
            if a > 250:
                samples.append((r, g, b))
        rows.append(
            tuple(sum(c[i] for c in samples) // len(samples) for i in range(3))
            if samples
            else None
        )
    # Chỉ tin phần giữa (20–80%): gần góc bo, mẫu dính viền tối của khung.
    # Ngoài vùng đó kéo phẳng màu của hàng biên.
    top, bottom = int(h * 0.2), int(h * 0.8)
    for i in range(h):
        if i < top:
            rows[i] = rows[top]
        elif i > bottom:
            rows[i] = rows[bottom]

    backdrop = Image.new("RGBA", (w, h))
    px_ = backdrop.load()
    for y in range(h):
        color = (*rows[y], 255)
        for x in range(w):
            px_[x, y] = color
    backdrop = backdrop.resize((px, px), Image.LANCZOS)

    inner = round(px * scale)
    art = square.resize((inner, inner), Image.LANCZOS)
    offset = (px - inner) // 2
    backdrop.alpha_composite(art, (offset, offset))
    return backdrop

rounded(512).save(f"{root}/public/icon-512.png")
rounded(192).save(f"{root}/public/icon-192.png")
flat(512, 0.8).save(f"{root}/public/icon-maskable-512.png")
flat(180).convert("RGB").save(f"{root}/app/apple-icon.png")
fav = Image.open(f"{root}/public/mascot/vit-tot-nghiep-trong.png").convert("RGBA")
fav.resize((64, 64), Image.LANCZOS).save(f"{root}/app/icon.png")
fav.resize((256, 256), Image.LANCZOS).save(f"{root}/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("icons written")
`;
execFileSync("python", ["-c", python], { stdio: "inherit" });
