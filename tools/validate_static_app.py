#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_APP_FILES = [
    "index.html",
    "styles.css",
    "app.js",
    "sw.js",
    "manifest.webmanifest",
    "data/assets-manifest.json",
]
REQUIRED_WEB_MANIFEST_FIELDS = [
    "name",
    "short_name",
    "description",
    "start_url",
    "display",
    "background_color",
    "theme_color",
]
REQUIRED_SERVICE_WORKER_ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.webmanifest",
    "./data/assets-manifest.json",
]
IMAGE_EXTENSIONS = {".avif", ".jpeg", ".jpg", ".png", ".webp"}
UNVERIFIED_LICENSE_VALUES = {"", "todo", "todo-source", "unknown", "unverified"}


def load_json(path: Path, errors: list[str]) -> object:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        errors.append(f"{path.relative_to(ROOT)} is not valid JSON: {exc}")
        return {}


def require_text_marker(path: str, text: str, marker: str, errors: list[str]) -> None:
    if marker not in text:
        errors.append(f"{path} is missing expected marker: {marker}")


def read_text(path: Path, errors: list[str]) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as exc:
        errors.append(f"{path.relative_to(ROOT)} could not be read: {exc}")
        return ""


def safe_repo_path(value: str, errors: list[str], asset_id: str, field: str) -> Path | None:
    rel = Path(value)
    if rel.is_absolute() or ".." in rel.parts:
        errors.append(f"{asset_id}.{field} must be a safe repo-relative path: {value}")
        return None
    return ROOT / rel


def has_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate_app_shell(errors: list[str]) -> None:
    for rel_path in REQUIRED_APP_FILES:
        path = ROOT / rel_path
        if not path.is_file():
            errors.append(f"Missing required app file: {rel_path}")

    index_text = read_text(ROOT / "index.html", errors)
    app_text = read_text(ROOT / "app.js", errors)
    sw_text = read_text(ROOT / "sw.js", errors)

    for marker in [
        '<link rel="manifest" href="manifest.webmanifest"',
        '<link rel="stylesheet" href="styles.css"',
        '<script src="app.js"',
        'id="app-main"',
    ]:
        require_text_marker("index.html", index_text, marker, errors)

    for marker in [
        'document.addEventListener("DOMContentLoaded"',
        'fetch("data/assets-manifest.json")',
        "renderDiscoveryGallery();",
        "registerServiceWorker();",
    ]:
        require_text_marker("app.js", app_text, marker, errors)

    for marker in REQUIRED_SERVICE_WORKER_ASSETS:
        require_text_marker("sw.js", sw_text, marker, errors)


def validate_web_manifest(errors: list[str]) -> None:
    manifest = load_json(ROOT / "manifest.webmanifest", errors)
    if not isinstance(manifest, dict):
        errors.append("manifest.webmanifest must be a JSON object")
        return

    for field in REQUIRED_WEB_MANIFEST_FIELDS:
        value = manifest.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"manifest.webmanifest requires non-empty string field: {field}")

    if manifest.get("display") != "standalone":
        errors.append("manifest.webmanifest display must stay set to standalone")

    icons = manifest.get("icons")
    if icons is not None and not isinstance(icons, list):
        errors.append("manifest.webmanifest icons must be a list when present")


def validate_asset_manifest(errors: list[str]) -> None:
    manifest_path = ROOT / "data/assets-manifest.json"
    manifest = load_json(manifest_path, errors)
    if not isinstance(manifest, dict):
        errors.append("data/assets-manifest.json must be a JSON object")
        return

    policy = manifest.get("policy")
    if not isinstance(policy, dict):
        errors.append("data/assets-manifest.json must include a policy object")
        return

    required_fields = policy.get("requiredFields")
    if not isinstance(required_fields, list) or not required_fields:
        errors.append("policy.requiredFields must be a non-empty list")
        return

    assets = manifest.get("assets")
    if not isinstance(assets, list) or not assets:
        errors.append("assets must be a non-empty list")
        return

    seen_ids: set[str] = set()
    referenced_files: set[Path] = set()

    for index, asset in enumerate(assets):
        if not isinstance(asset, dict):
            errors.append(f"assets[{index}] must be an object")
            continue

        asset_id = asset.get("id")
        if not isinstance(asset_id, str) or not asset_id.strip():
            errors.append(f"assets[{index}] is missing a non-empty id")
            asset_id = f"assets[{index}]"
        elif asset_id in seen_ids:
            errors.append(f"Duplicate asset id: {asset_id}")
        else:
            seen_ids.add(asset_id)

        for field in required_fields:
            if field not in asset:
                errors.append(f"{asset_id} is missing required field: {field}")
                continue
            if field == "formats":
                if not isinstance(asset[field], dict):
                    errors.append(f"{asset_id}.formats must be an object")
            elif not isinstance(asset[field], str) or not asset[field].strip():
                errors.append(f"{asset_id}.{field} must be a non-empty string")

        status = str(asset.get("status", "")).strip().lower()
        if status != "ready":
            errors.append(f"{asset_id}.status must be ready before shipping")

        license_value = str(asset.get("license", "")).strip().lower()
        if license_value in UNVERIFIED_LICENSE_VALUES:
            errors.append(f"{asset_id}.license must be verified, not {asset.get('license')!r}")

        source_url = asset.get("sourceUrl")
        if not isinstance(source_url, str) or not has_http_url(source_url):
            errors.append(f"{asset_id}.sourceUrl must be an absolute HTTP(S) URL")

        formats = asset.get("formats")
        if not isinstance(formats, dict):
            continue

        for field in ("master", "web"):
            value = formats.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{asset_id}.formats.{field} must be a non-empty string")
                continue

            file_path = safe_repo_path(value, errors, asset_id, f"formats.{field}")
            if file_path is None:
                continue
            if not file_path.is_file():
                errors.append(f"{asset_id}.formats.{field} file does not exist: {value}")
                continue
            if file_path.stat().st_size == 0:
                errors.append(f"{asset_id}.formats.{field} file is empty: {value}")
            referenced_files.add(file_path.resolve())

    for directory in ("assets/master", "assets/web"):
        directory_path = ROOT / directory
        if not directory_path.is_dir():
            errors.append(f"Missing asset directory: {directory}")
            continue
        for image_path in directory_path.iterdir():
            if image_path.suffix.lower() in IMAGE_EXTENSIONS and image_path.resolve() not in referenced_files:
                errors.append(f"Unreferenced asset file: {image_path.relative_to(ROOT)}")


def main() -> int:
    errors: list[str] = []
    validate_app_shell(errors)
    validate_web_manifest(errors)
    validate_asset_manifest(errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("DinoLab static app validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
