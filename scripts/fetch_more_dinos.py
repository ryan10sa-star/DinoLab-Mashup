#!/usr/bin/env python3
"""Fetch more dinosaur and prehistoric animal images from Wikimedia Commons."""

import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

WIKI_API = "https://commons.wikimedia.org/w/api.php"
MASTER_DIR = Path("assets/master")
WEB_DIR = Path("assets/web")
MANIFEST_PATH = Path("data/assets-manifest.json")

# Specific dinosaur and prehistoric animal search terms
SEARCH_TERMS = [
    "Tyrannosaurus rex skeleton",
    "Triceratops skull",
    "Velociraptor fossil",
    "Stegosaurus skeleton",
    "Brachiosaurus skeleton",
    "Pteranodon fossil",
    "Ankylosaurus fossil",
    "Spinosaurus skeleton",
    "Allosaurus skeleton",
    "Parasaurolophus skull",
    "Protoceratops fossil",
    "Pachycephalosaurus skull",
    "Deinonychus fossil",
    "Iguanodon skeleton",
    "Carnotaurus skeleton",
    "Diplodocus skeleton",
    "Apatosaurus skeleton",
    "Mosasaurus fossil",
    "Plesiosaurus skeleton",
    "Ichthyosaurus fossil",
    "Mammoth skeleton",
    "Woolly mammoth",
    "Saber tooth tiger",
    "Megalodon tooth",
    "Archaeopteryx fossil",
    "Pterodactyl fossil",
    "Ammonite fossil",
    "Raptor claw fossil",
    "Dinosaur footprint",
    "Dinosaur skeleton museum",
    "Ceratopsian skull",
    "Theropod dinosaur",
    "Sauropod dinosaur",
    "Hadrosaur skeleton",
    "Ornithopod fossil",
]

FREE_LICENSES = [
    "pd", "public domain", "cc0", "cc-zero",
    "cc-by-sa", "cc-by", "gfdl"
]

def load_existing_manifest():
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            return json.load(f)
    return {"version": 2, "updatedAt": "", "policy": {}, "assets": []}

def get_existing_titles(manifest):
    return {a["title"].lower() for a in manifest.get("assets", [])}

def search_images(term, limit=15):
    """Search Wikimedia Commons for images matching term."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": "6",  # File namespace
        "gsrsearch": f"filetype:bitmap {term}",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "800"
    }
    url = f"{WIKI_API}?{urllib.parse.urlencode(params)}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DinoLabMashup/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get("query", {}).get("pages", {})
            return list(pages.values())
    except Exception as e:
        print(f"  Search error for '{term}': {e}")
        return []

def is_free_license(license_str):
    if not license_str:
        return False
    lower = license_str.lower()
    return any(lic in lower for lic in FREE_LICENSES)

def sanitize_filename(title):
    name = re.sub(r"^File:", "", title, flags=re.IGNORECASE)
    name = re.sub(r"[^a-zA-Z0-9._-]", "-", name).lower()
    name = re.sub(r"-+", "-", name).strip("-")
    return name[:100] + ".jpg"

def download_image(url, dest):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DinoLabMashup/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(dest, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False

def main():
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    
    manifest = load_existing_manifest()
    existing_titles = get_existing_titles(manifest)
    new_assets = []
    
    print(f"Starting with {len(manifest['assets'])} existing assets")
    print(f"Searching {len(SEARCH_TERMS)} terms...\n")
    
    for i, term in enumerate(SEARCH_TERMS):
        print(f"[{i+1}/{len(SEARCH_TERMS)}] Searching: {term}")
        
        results = search_images(term, limit=8)
        time.sleep(1.5)  # Rate limiting
        
        for page in results:
            title = page.get("title", "")
            if title.lower() in existing_titles:
                continue
            
            info = page.get("imageinfo", [{}])[0]
            meta = info.get("extmetadata", {})
            
            # Check license
            license_str = meta.get("LicenseShortName", {}).get("value", "")
            if not is_free_license(license_str):
                continue
            
            # Skip small images
            width = info.get("width", 0)
            height = info.get("height", 0)
            if width < 400 or height < 300:
                continue
            
            # Get URLs
            thumb_url = info.get("thumburl", info.get("url", ""))
            source_url = info.get("descriptionurl", "")
            
            if not thumb_url:
                continue
            
            # Download
            filename = sanitize_filename(title)
            master_path = MASTER_DIR / filename
            web_path = WEB_DIR / filename
            
            if master_path.exists():
                continue
            
            print(f"  Downloading: {filename[:50]}...")
            if download_image(thumb_url, master_path):
                # Copy to web folder
                import shutil
                shutil.copy(master_path, web_path)
                
                # Create asset entry
                creator = meta.get("Artist", {}).get("value", "Unknown")
                creator = re.sub(r"<[^>]+>", "", creator)[:80]
                
                desc = meta.get("ImageDescription", {}).get("value", "")
                desc = re.sub(r"<[^>]+>", "", desc)[:150] or f"Image of {term}"
                
                asset = {
                    "id": f"wmc-{filename.replace('.jpg', '')}",
                    "category": "dinosaur-reconstruction" if "skeleton" in term.lower() or "skull" in term.lower() else "fossil-photo",
                    "title": title.replace("File:", ""),
                    "subject": term.split()[0],
                    "creator": creator,
                    "sourceUrl": source_url,
                    "license": license_str,
                    "status": "ready",
                    "formats": {
                        "master": f"assets/master/{filename}",
                        "web": f"assets/web/{filename}"
                    },
                    "altText": desc
                }
                new_assets.append(asset)
                existing_titles.add(title.lower())
                
                time.sleep(0.5)
        
        # Progress save every 5 terms
        if (i + 1) % 5 == 0 and new_assets:
            print(f"\n  Progress: {len(new_assets)} new images so far\n")
    
    # Update manifest
    if new_assets:
        # Remove assets for deleted files
        manifest["assets"] = [
            a for a in manifest["assets"]
            if Path(a["formats"]["master"]).exists()
        ]
        manifest["assets"].extend(new_assets)
        manifest["updatedAt"] = "2026-02-22"
        
        with open(MANIFEST_PATH, "w") as f:
            json.dump(manifest, f, indent=2)
        
        print(f"\n✅ Added {len(new_assets)} new images!")
        print(f"Total assets: {len(manifest['assets'])}")
    else:
        print("\nNo new images found.")

if __name__ == "__main__":
    main()
