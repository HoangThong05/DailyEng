"""
Tải ảnh minh hoạ cho trò Nghe chọn hình từ Pixabay.

Mỗi từ trong content/emoji-words.json lấy một ảnh, thu nhỏ 480×360 WebP vào
public/photos/<slug>.webp và ghi content/photo-words.json (từ → tên file).
Chạy lại thì bỏ qua ảnh đã có. Cần PIXABAY_KEY trong .env.local
(đăng ký miễn phí tại https://pixabay.com/api/docs/).

    python scripts/fetch-photos.py            # tải từ còn thiếu
    python scripts/fetch-photos.py --redo run # tải lại ảnh cho từ "run"
"""

import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EMOJI_FILE = ROOT / "content" / "emoji-words.json"
PHOTO_FILE = ROOT / "content" / "photo-words.json"
OUT_DIR = ROOT / "public" / "photos"
SIZE = (480, 360)

# Từ mơ hồ hoặc trừu tượng: mô tả rõ hơn để ảnh đúng ý.
QUERY_HINTS = {
    "run": "person running outdoors",
    "walk": "person walking street",
    "swim": "person swimming pool",
    "dance": "people dancing",
    "sing": "singer microphone",
    "eat": "person eating meal",
    "drink": "person drinking water glass",
    "drive": "person driving car steering wheel",
    "fly": "airplane flying sky",
    "read": "person reading book",
    "write": "hand writing pen paper",
    "cook": "chef cooking kitchen",
    "sleep": "person sleeping bed",
    "cold": "winter snow cold person",
    "hot": "hot sun heat summer",
    "happy": "happy smiling person",
    "sad": "sad person crying",
    "angry": "angry man face",
    "tired": "tired person yawning",
    "sick": "sick person thermometer bed",
    "one": "number one",
    "two": "number two",
    "three": "number three",
    "ten": "number ten",
    "hundred": "100 number",
    "red": "red color paint",
    "blue": "blue color paint",
    "green": "green color leaves",
    "yellow": "yellow color paint",
    "black": "black color texture",
    "white": "white color texture",
    "morning": "sunrise morning",
    "night": "night city stars",
    "home": "cozy home house exterior",
    "family": "family together",
    "friend": "friends laughing together",
    "man": "man portrait",
    "woman": "woman portrait",
    "boy": "boy child",
    "girl": "girl child",
    "baby": "baby",
    "head": "human head portrait",
    "hand": "human hand",
    "arm": "human arm muscle",
    "leg": "human legs",
    "foot": "bare foot",
    "eye": "human eye close up",
    "ear": "human ear",
    "nose": "human nose",
    "mouth": "mouth lips smile",
    "hair": "hair hairstyle",
    "brain": "brain anatomy model",
    "tooth": "tooth dental",
    "teeth": "teeth smile dental",
    "heart": "red heart shape",
    "card": "credit card",
    "letter": "handwritten letter envelope",
    "email": "email laptop screen",
    "film": "cinema film reel",
    "movie": "cinema movie theater",
    "music": "music headphones notes",
    "game": "video game controller",
    "party": "party celebration confetti",
    "gift": "gift box ribbon",
    "map": "paper map travel",
    "key": "metal key",
    "ticket": "event ticket",
    "money": "cash money banknotes",
    "bill": "restaurant bill receipt",
    "fee": "fee payment",
    "price": "price tag",
    "sale": "sale sign shop",
    "law": "law gavel justice",
    "court": "courtroom",
    "vote": "voting ballot box",
    "city": "city skyline",
    "village": "village houses countryside",
    "sea": "ocean sea waves",
    "station": "train station platform",
    "subway": "subway metro train",
    "office": "modern office desk",
    "market": "market stall vegetables",
    "store": "retail store shelves",
    "shop": "small shop storefront",
    "bank": "bank building",
    "school": "school building classroom",
    "gym": "gym fitness weights",
    "park": "city park trees bench",
    "menu": "restaurant menu",
    "meeting": "business meeting people",
    "presentation": "business presentation screen",
    "contract": "signing contract document",
    "signature": "signature pen document",
    "budget": "budget calculator money",
    "salary": "salary money envelope",
    "delivery": "delivery courier package",
    "package": "cardboard package box",
    "parcel": "parcel box",
    "flight": "airplane flight window",
    "safety": "safety helmet vest",
    "tools": "hand tools workshop",
    "machine": "industrial machine",
    "gear": "metal gears",
    "diet": "healthy diet food",
    "exercise": "exercise workout",
    "weather": "weather clouds sky",
    "earth": "planet earth space",
    "plant": "green plant pot",
    "photo": "camera photograph",
    "video": "video camera recording",
    "song": "singing song microphone",
    "painting": "painting canvas art",
    "shopping": "shopping bags",
    "cart": "shopping cart",
    "basket": "wicker basket",
    "scale": "weighing scale",
    "judge": "judge gavel",
    "lawyer": "lawyer suit",
    "government": "government building",
    "farm": "farm field barn",
    "harvest": "wheat harvest",
    "ice": "ice cubes",
    "oven": "kitchen oven",
    "roof": "house roof tiles",
    "road": "empty road",
    "fuel": "fuel pump gas station",
    "parking": "parking lot cars",
    "first aid": "first aid kit",
    "camping": "camping tent",
    "picnic": "picnic blanket food",
    "hiking": "hiking trail mountains",
    "fishing": "fishing rod lake",
    "skiing": "skiing snow",
    "surfing": "surfing wave",
    "cycling": "cycling bicycle road",
    "golf": "golf ball green",
    "boxing": "boxing gloves",
    "chess": "chess board",
    "dice": "dice game",
    "cards": "playing cards",
    "cooking": "cooking pan stove",
    "dancing": "people dancing",
    "swimming": "swimming pool swimmer",
    "running": "runner running",
    "wedding": "wedding couple",
    "graduation": "graduation cap students",
    "christmas": "christmas tree lights",
    "concert": "concert crowd stage",
    "festival": "festival crowd",
    "theater": "theater stage curtain",
    "alarm": "alarm clock",
    "flag": "flag waving",
    "stamp": "postage stamp",
    "recycle": "recycling bins",
    "storm": "storm lightning",
    "candle": "candle flame",
}

SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(term: str) -> str:
    return SLUG_RE.sub("-", term.lower()).strip("-")


def load_env_key() -> str:
    key = os.environ.get("PIXABAY_KEY")
    if key:
        return key
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("PIXABAY_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    sys.exit("Thiếu PIXABAY_KEY trong .env.local (xem https://pixabay.com/api/docs/)")


def search(key: str, query: str) -> dict | None:
    params = urllib.parse.urlencode(
        {
            "key": key,
            "q": query,
            "image_type": "photo",
            "orientation": "horizontal",
            "safesearch": "true",
            "per_page": 5,
            "lang": "en",
        }
    )
    with urllib.request.urlopen(f"https://pixabay.com/api/?{params}", timeout=20) as res:
        data = json.load(res)
    hits = data.get("hits") or []
    return hits[0] if hits else None


def download(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "DailyEng/1.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return Image.open(io.BytesIO(res.read())).convert("RGB")


def fit_cover(img: Image.Image) -> Image.Image:
    """Cắt về đúng tỉ lệ 4:3 rồi thu nhỏ — ảnh nào cũng ra cùng khung."""
    target = SIZE[0] / SIZE[1]
    ratio = img.width / img.height
    if ratio > target:
        new_w = int(img.height * target)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        new_h = int(img.width / target)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))
    return img.resize(SIZE, Image.LANCZOS)


def main() -> None:
    key = load_env_key()
    redo = set(sys.argv[2:]) if len(sys.argv) > 2 and sys.argv[1] == "--redo" else set()

    emoji = json.loads(EMOJI_FILE.read_text(encoding="utf-8"))
    terms = [t for t in emoji if not t.startswith("_")]
    photos: dict[str, dict] = {}
    if PHOTO_FILE.exists():
        photos = json.loads(PHOTO_FILE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    done = 0
    for term in terms:
        slug = slugify(term)
        out = OUT_DIR / f"{slug}.webp"
        if term in photos and out.exists() and term not in redo:
            continue

        query = QUERY_HINTS.get(term, term)
        try:
            hit = search(key, query)
            if not hit:
                print(f"  (không có ảnh) {term}")
                continue
            img = fit_cover(download(hit["webformatURL"]))
            img.save(out, "WEBP", quality=82, method=6)
            photos[term] = {
                "file": f"{slug}.webp",
                "credit": hit.get("user", ""),
                "source": hit.get("pageURL", ""),
            }
            done += 1
            print(f"✓ {term:20s} ← {query}")
        except Exception as error:  # noqa: BLE001 — một ảnh lỗi không nên dừng cả đợt
            print(f"✗ {term}: {error}")

        # Pixabay giới hạn 100 yêu cầu/phút; mỗi từ tốn 2 (tìm + tải).
        time.sleep(1.3)

    PHOTO_FILE.write_text(
        json.dumps(photos, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"\nXong: thêm {done} ảnh, tổng {len(photos)}/{len(terms)} từ có ảnh.")


if __name__ == "__main__":
    main()
