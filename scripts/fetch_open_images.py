#!/usr/bin/env python3
import html
import json
import re
import shutil
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = ROOT / "assets" / "master"
WEB_DIR = ROOT / "assets" / "web"
MANIFEST_PATH = ROOT / "data" / "assets-manifest.json"

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

SEARCH_TERMS = [
    "dinosaur fossil museum",
    "dinosaur skeleton museum",
    "trilobite fossil",
    "ammonite fossil",
    "mammoth skeleton",
    "smilodon fossil",
    "prehistoric animal fossil",
    "dinosauria fossils"
]

TARGET_COUNT = 80
PER_TERM_SCAN_LIMIT = 220


def http_json(url: str) -> dict:
    for attempt in range(5):
        req = Request(url, headers={"User-Agent": "DinoLabMashupBot/1.0"})
        try:
            with urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 429 and attempt < 4:
                time.sleep(1.2 * (attempt + 1))
                continue
            raise


def download_file(url: str, output_path: Path) -> bool:
    for attempt in range(5):
        try:
            req = Request(url, headers={"User-Agent": "DinoLabMashupBot/1.0"})
            with urlopen(req, timeout=60) as resp, output_path.open("wb") as f:
                shutil.copyfileobj(resp, f)
            if output_path.stat().st_size == 0:
                output_path.unlink(missing_ok=True)
                return False
            return True
        except HTTPError as error:
            if error.code in {429, 503} and attempt < 4:
                time.sleep(1.5 * (attempt + 1))
                continue
            output_path.unlink(missing_ok=True)
            return False
        except Exception:
            output_path.unlink(missing_ok=True)
            return False


def clean_text(value: str) -> str:
    text = value or ""
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).strip()
    return re.sub(r"\s+", " ", text)


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] if slug else "asset"


def allowed_license(license_name: str, usage_terms: str) -> bool:
    text = f"{license_name} {usage_terms}".lower()
    if "public domain" in text:
        return True
    return "cc by" in text or "creative commons" in text or "cc0" in text


def build_fileinfo_query(titles: str) -> str:
    params = {
        "action": "query",
        "format": "json",
        "prop": "imageinfo",
        "titles": titles,
        "iiprop": "url|extmetadata",
        "iiurlwidth": 1600,
    }
    return f"{WIKIMEDIA_API}?{urlencode(params)}"


def chunks(values: list[str], size: int):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def build_search_query(term: str, sroffset: int) -> str:
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": term,
        "srnamespace": 6,
        "srlimit": 50,
        "sroffset": sroffset,
    }
    return f"{WIKIMEDIA_API}?{urlencode(params)}"


def choose_category(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    if "fossil" in text or "skeleton" in text or "bone" in text:
        return "fossil-photo"
    if any(k in text for k in ["mammoth", "smilodon", "saber", "trilobite", "ammonite", "prehistoric"]):
        return "prehistoric-animal"
    return "dinosaur-reconstruction"


def pick_subject(title: str, description: str) -> str:
    for candidate in [
        "Tyrannosaurus",
        "Triceratops",
        "Velociraptor",
        "Stegosaurus",
        "Brachiosaurus",
        "Spinosaurus",
        "Mammoth",
        "Smilodon",
        "Trilobite",
        "Ammonite",
        "Ichthyosaur",
        "Plesiosaur",
    ]:
        joined = f"{title} {description}".lower()
        if candidate.lower() in joined:
            return candidate
    return "Prehistoric specimen"


def main() -> int:
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    (ROOT / "data").mkdir(parents=True, exist_ok=True)

    seen_titles = set()
    assets = []

    for term in SEARCH_TERMS:
        if len(assets) >= TARGET_COUNT:
            break

        scanned = 0
        sroffset = 0

        while scanned < PER_TERM_SCAN_LIMIT and len(assets) < TARGET_COUNT:
            query_url = build_search_query(term, sroffset)
            try:
                data = http_json(query_url)
            except Exception:
                break

            members = data.get("query", {}).get("search", [])
            if not members:
                break

            for member in members:
                if len(assets) >= TARGET_COUNT or scanned >= PER_TERM_SCAN_LIMIT:
                    break

                scanned += 1
                title = member.get("title", "")
                if not title.startswith("File:"):
                    continue
                if title in seen_titles:
                    continue

                if re.search(r"\.(svg|tif|tiff|gif)$", title.lower()):
                    continue

            candidate_titles = [
                member.get("title", "")
                for member in members
                if member.get("title", "").startswith("File:") and member.get("title", "") not in seen_titles
            ]

            for title_chunk in chunks(candidate_titles, 20):
                try:
                    detail_data = http_json(build_fileinfo_query("|".join(title_chunk)))
                except Exception:
                    continue

                pages = detail_data.get("query", {}).get("pages", {})
                for page in pages.values():
                    title = page.get("title", "")
                    if len(assets) >= TARGET_COUNT:
                        break
                    if not title.startswith("File:"):
                        continue
                    if title in seen_titles:
                        continue

                    info = (page.get("imageinfo") or [{}])[0]
                    extmeta = info.get("extmetadata", {})

                    license_name = clean_text((extmeta.get("LicenseShortName") or {}).get("value", ""))
                    usage_terms = clean_text((extmeta.get("UsageTerms") or {}).get("value", ""))
                    artist = clean_text((extmeta.get("Artist") or {}).get("value", "")) or "Unknown"
                    description = clean_text((extmeta.get("ImageDescription") or {}).get("value", ""))

                    if not allowed_license(license_name, usage_terms):
                        continue

                    source_url = info.get("descriptionurl") or ""
                    image_url = info.get("thumburl") or info.get("url") or ""

                    if not source_url or not image_url:
                        continue

                    ext = Path(image_url.split("?")[0]).suffix.lower()
                    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
                        continue

                    display_name = title.replace("File:", "")
                    lower_label = f"{display_name} {description}".lower()
                    if any(word in lower_label for word in ["map", "logo", "icon"]):
                        continue

                    slug = safe_slug(display_name)
                    file_name = f"{slug}{ext if ext != '.jpeg' else '.jpg'}"

                    master_path = MASTER_DIR / file_name
                    web_path = WEB_DIR / file_name

                    if not master_path.exists():
                        ok = download_file(image_url, master_path)
                        if not ok:
                            continue
                        shutil.copy2(master_path, web_path)
                        time.sleep(0.2)
                    elif not web_path.exists():
                        shutil.copy2(master_path, web_path)

                    category_name = choose_category(display_name, description)
                    subject = pick_subject(display_name, description)
                    alt_text = description[:140] if description else f"Open-license image of {subject}"

                    assets.append(
                        {
                            "id": f"wmc-{slug}",
                            "category": category_name,
                            "title": display_name,
                            "subject": subject,
                            "creator": artist,
                            "sourceUrl": source_url,
                            "license": license_name or usage_terms or "Open License",
                            "status": "ready",
                            "formats": {
                                "master": f"assets/master/{file_name}",
                                "web": f"assets/web/{file_name}",
                            },
                            "altText": alt_text,
                        }
                    )
                    seen_titles.add(title)

                time.sleep(0.35)

            sroffset += len(members)
            if len(members) < 50:
                break

    manifest = {
        "version": 2,
        "updatedAt": time.strftime("%Y-%m-%d"),
        "policy": {
            "requiredFields": [
                "id",
                "category",
                "title",
                "subject",
                "creator",
                "sourceUrl",
                "license",
                "status",
                "formats",
                "altText",
            ],
            "notes": "Images pulled from Wikimedia Commons; verify attribution display in production UI.",
        },
        "assets": assets,
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {len(assets)} open-license assets to {MANIFEST_PATH}")
    return 0 if assets else 1


if __name__ == "__main__":
    sys.exit(main())