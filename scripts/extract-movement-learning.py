"""Create an auditable historical subset: select existing GPS events, no interpolation."""
import csv
import datetime as dt
import hashlib
import io
import json
import pathlib
import sys
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public/lernen/bewegung-entwicklung-2026"
CACHE = pathlib.Path(sys.argv[1]).resolve()
ARCHIVE = CACHE / "lifetrack-sw-germany-gps-original.csv.zip"
ANIMAL = "Olea + / DER AN868 (eobs 3644)"
START, END = "2014-08-23", "2014-09-04"
selected = {}
matching = 0
with zipfile.ZipFile(ARCHIVE) as archive:
    with io.TextIOWrapper(archive.open(archive.namelist()[0]), encoding="utf-8") as stream:
        reader = csv.DictReader(stream)
        fields = reader.fieldnames
        seen_animal = False
        for row in reader:
            if row["individual-local-identifier"] != ANIMAL:
                if seen_animal: break  # Original export groups this first animal contiguously.
                continue
            seen_animal = True
            day = row["timestamp"][:10]
            if not START <= day <= END: continue
            if row["visible"] != "TRUE" or row["sensor-type"] != "gps" or row["eobs:status"] != "A": continue
            try: lat, lon = float(row["location-lat"]), float(row["location-long"])
            except ValueError: continue
            if not (-90 <= lat <= 90 and -180 <= lon <= 180): continue
            matching += 1
            timestamp = dt.datetime.fromisoformat(row["timestamp"])
            for hour in (0, 6, 12, 18):
                target = dt.datetime.fromisoformat(day).replace(hour=hour)
                gap = abs((timestamp - target).total_seconds())
                if gap > 3 * 3600: continue
                key = (day, hour)
                if key not in selected or (gap, row["event-id"]) < (selected[key][0], selected[key][1]["event-id"]):
                    selected[key] = (gap, row.copy())
rows = [(key, item[1]) for key, item in sorted(selected.items())]
with (OUT / "weissstorch-originalausschnitt.csv").open("w", encoding="utf-8", newline="") as dest:
    writer = csv.DictWriter(dest, fieldnames=fields)
    writer.writeheader(); writer.writerows(row for _, row in rows)
points = [{"eventId": row["event-id"], "timestamp": row["timestamp"], "longitude": float(row["location-long"]), "latitude": float(row["location-lat"]), "targetHour": key[1], "horizontalAccuracyEstimateMetres": float(row["eobs:horizontal-accuracy-estimate"]) if row["eobs:horizontal-accuracy-estimate"] else None} for key, row in rows]
if len(points) != len({p["eventId"] for p in points}): raise ValueError("Sampling selected a repeated event")
(OUT / "weissstorch-messpunkte.json").write_text(json.dumps(points, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
map_url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson"
map_path = CACHE / "ne_110m_admin_0_countries-v5.1.2.geojson"
if not map_path.exists(): urllib.request.urlretrieve(map_url, map_path)
world = json.loads(map_path.read_text(encoding="utf-8"))
countries = [{"id": f["properties"]["ADM0_A3"], "name": f["properties"]["NAME_DE"], "geometry": f["geometry"]} for f in world["features"] if f["properties"]["ADM0_A3"] in {"DEU", "CHE", "FRA", "ESP", "AUT", "ITA", "PRT", "BEL", "LUX", "NLD"}]
(OUT / "europa-natural-earth.json").write_text(json.dumps(countries, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
hash_file = lambda path: hashlib.file_digest(path.open("rb"), "sha256").hexdigest()
audit = {"reviewedOn": "2026-10-13", "originalDoi": "https://doi.org/10.5441/001/1.ck04mn78", "license": "CC0 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "originalDownload": "https://datarepository.movebank.org/server/api/core/bitstreams/ea18f8fd-5e0f-4271-85f3-f995eabfb724/content", "originalArchiveSha256": hash_file(ARCHIVE), "originalArchiveBytes": ARCHIVE.stat().st_size, "animalIdentifier": ANIMAL, "tagIdentifier": "3644", "requestedPeriod": [START, END], "matchingOriginalEvents": matching, "displayedEvents": len(points), "firstTimestamp": points[0]["timestamp"], "lastTimestamp": points[-1]["timestamp"], "filter": "Only the first contiguous animal group Olea; inclusive dates 2014-08-23..2014-09-04, visible TRUE, sensor-type gps, eobs:status A, valid WGS84 coordinate range. Per published calendar day and target hour 00/06/12/18, select closest existing timestamp within 3 hours; ties lexical event ID. No mean position, interpolation, rounded stored coordinate, invented timestamp or connection.", "timeBasis": "README: UTC or GPS time (a few leap seconds different); exact timestamp strings are retained; no claim of local clock time.", "map": {"producer": "Natural Earth", "version": "5.1.2", "resolution": "1:110 million", "source": map_url, "license": "Public domain", "terms": "https://www.naturalearthdata.com/about/terms-of-use/", "sha256": hash_file(map_path), "modifications": "Select 10 European countries; retain exact polygon coordinates, omit unused metadata. Render a simplified overview in Mercator projection, not navigation boundaries."}, "outputs": {filename: hash_file(OUT / filename) for filename in ("weissstorch-originalausschnitt.csv", "weissstorch-messpunkte.json", "europa-natural-earth.json", "lifetrack-original-readme.txt", "lifetrack-original-reference.csv", "lifetrack-original-metadata.json")}}
(OUT / "bewegungsdaten-nachweis.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"matching": matching, "points": len(points), "first": points[0], "last": points[-1], "countries": [c["id"] for c in countries]}, indent=2))
