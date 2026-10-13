"""Reproducible source downloads; huge tracking archive stays outside Git.

Run: python scripts/prepare-movement-development-media.py <download-cache>
Only documented originals, never reconstructed time/position/photo sequences.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public/lernen/bewegung-entwicklung-2026"
CACHE = pathlib.Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
API = "https://datarepository.movebank.org/server/api"

def download(url, target):
    if not target.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "Jagdlatein-source-verification/1.0 (educational source audit)"})
        with urllib.request.urlopen(request, timeout=90) as response, target.open("wb") as dest:
            while block := response.read(1024 * 1024):
                dest.write(block)
    return {"url": url, "file": target.name, "bytes": target.stat().st_size,
            "sha256": hashlib.file_digest(target.open("rb"), "sha256").hexdigest()}

jobs = [
    (f"{API}/core/bitstreams/ea18f8fd-5e0f-4271-85f3-f995eabfb724/content", CACHE / "lifetrack-sw-germany-gps-original.csv.zip"),
    (f"{API}/core/bitstreams/523124e1-adc1-47ad-b945-e5c27822ca1e/content", OUT / "lifetrack-original-readme.txt"),
    (f"{API}/core/bitstreams/173fd0a6-8134-47be-8f1b-ffcd3eba0fb3/content", OUT / "lifetrack-original-reference.csv"),
    (f"{API}/pid/find?id=10255/move.912", OUT / "lifetrack-original-metadata.json"),
]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records = list(pool.map(lambda job: download(*job), jobs))
(CACHE / "downloads.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(records, indent=2))
