"""Actual STFTs of the complete local MP3 recordings; originals remain unchanged.
Usage: python script.py --recordings metadata.json [--dependencies local-pip-directory]
Requires numpy, soundfile, matplotlib. No network access and no artificial audio.
"""
import argparse, hashlib, json, sys, unicodedata
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument('--recordings', required=True)
p.add_argument('--dependencies')
args = p.parse_args()
if args.dependencies: sys.path.insert(0, args.dependencies)
import numpy as np
import soundfile as sf
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root = Path(__file__).resolve().parent.parent
out = root / 'public/lernen/klangbilder-2026'
out.mkdir(parents=True, exist_ok=True)
metadata = []
used_names = set()
for sound in json.loads(Path(args.recordings).read_text(encoding='utf-8-sig')):
    original = root / 'public' / sound['src'].lstrip('/')
    samples, rate = sf.read(original, dtype='float32', always_2d=True)
    # Averaging channel powers preserves stereo signals that cancel in a mono mix.
    nfft, hop = 1024, 256
    # Include the last real sample, filling only the final analysis window with zeros.
    pad = nfft - len(samples) if len(samples) < nfft else (hop - (len(samples) - nfft) % hop) % hop
    signal = np.pad(samples, ((0, pad), (0, 0)))
    windows = np.lib.stride_tricks.sliding_window_view(signal, nfft, axis=0)[::hop]
    power = np.abs(np.fft.rfft(windows * np.hanning(nfft), axis=-1)) ** 2
    power = power.mean(axis=1).T
    freq = np.fft.rfftfreq(nfft, 1 / rate)
    maximum = min(12000, rate / 2)
    keep = freq <= maximum
    peak = max(float(power.max()), np.finfo(float).tiny)
    relative = 10 * np.log10(np.maximum(power[keep], peak * 1e-8) / peak)
    times = (np.arange(relative.shape[1]) * hop + nfft / 2) / rate
    # Rendering aggregates time columns by maximum power, labelled in the method.
    # This keeps brief calls visible in a full recording; it is no sample-level plot.
    if relative.shape[1] > 1000:
        edges = np.linspace(0, relative.shape[1], 1001, dtype=int)
        relative = np.stack([relative[:, edges[i]:edges[i+1]].max(axis=1) for i in range(1000)], axis=1)
        times = np.array([(edges[i] + edges[i+1] - 1) / 2 * hop / rate + nfft / (2 * rate) for i in range(1000)])
    fig, ax = plt.subplots(figsize=(10.8, 4.4), layout='constrained')
    fig.patch.set_facecolor('#fbf7ee')
    image = ax.pcolormesh(times, freq[keep] / 1000, relative, shading='nearest', cmap='magma', vmin=-80, vmax=0, rasterized=True)
    ax.set(xlabel='Zeit seit Aufnahmebeginn (Sekunden)', ylabel='Frequenz (kHz)', xlim=(0, len(samples) / rate), ylim=(0, maximum / 1000))
    bar = fig.colorbar(image, ax=ax, pad=.025)
    bar.set_label('Pegel relativ zum Maximum dieser Aufnahme (dB)')
    filename = unicodedata.normalize('NFKD', sound['id'].replace('ß', 'ss')).encode('ascii', 'ignore').decode('ascii') + '.webp'
    if filename in used_names: raise ValueError('Duplicate ASCII image name')
    used_names.add(filename)
    target = out / filename
    fig.savefig(target, dpi=120, format='webp', pil_kwargs={'quality': 90})
    plt.close(fig)
    metadata.append({
      'id': sound['id'], 'src': '/lernen/klangbilder-2026/' + target.name,
      'originalSrc': sound['src'], 'originalSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
      'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
      'durationSeconds': round(len(samples) / rate, 6), 'sampleRate': rate, 'channels': samples.shape[1],
      'fftSize': nfft, 'hopSize': hop, 'window': 'Hann', 'maxFrequencyHz': maximum,
      'endPaddingSamples': pad,
      'displayRangeDb': [-80, 0], 'timeAggregation': 'maximum power per rendered time column when >1000 STFT frames',
      'sourceUrl': sound['sourceUrl'], 'author': sound['author'], 'license': sound['license'], 'licenseUrl': sound['licenseUrl'],
      'transformation': 'Jagdlatein: STFT der vollständigen MP3, Kanal-Leistungen gemittelt; Farbgrafik, keine Änderung der Audiodatei.',
      'generatedOn': '2026-10-13'
    })
(out / 'nachweise.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(metadata)} genuine recording spectrograms prepared.')
