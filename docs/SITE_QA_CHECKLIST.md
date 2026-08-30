# Site QA checklist

Automated coverage lives in `tools/full_site_qa.py` (structural checks + Playwright matrix). Run it before publish:

```bash
python tools/build_deployment.py
python tools/full_site_qa.py              # structural + Playwright
python tools/full_site_qa.py --structural # CI / fast gate (no browser)
```

Expect `FAIL=0`. WARN lines should be understood before upload.

CI (`.github/workflows/site-qa.yml`) runs structural QA after rebuilding `deployment/`, plus `tools/test_publish_policy.py` and API pytest. Pins: `tools/requirements.txt`.

## Automated (script)

- Asset `?v=` unified; `404.html` on current stamp
- `deployment/` hashes match shared `assets/site.css`, `site.js`, inventions CSS/JS (skipped with WARN if `deployment/` missing)
- Repo + deployment `sitemap.xml` Discoveries locs match publish policy (default: none)
- Footer structure parity (linked logo + phone/address stubs) on az/en/ru/ky homes
- `translation_manifest` audio flags match story MP3s on disk
- Landmarks, page-jump, back-to-top / go-to-bottom on sampled pages
- No horizontal overflow @360 / 390 / 768 / 1024 / 1440 (Playwright; omitted with `--structural`)
- Discoveries sample: entry body black, titles centered, category-head brand text
- Bytecode builder backup present (`tools/_bytecode_backup/`)

## Manual / hardware (not in script)

- [ ] iOS Safari, Android Chrome, Samsung Internet
- [ ] Portrait and landscape
- [ ] Real touch on language switcher and sticky controls
- [ ] Live Hostinger sitemap vs intended Discoveries policy
- [ ] After upload: hard-refresh; heroes and CSS load (no stale cache)

## Content / parity spot-checks

- [ ] AZ / EN / RU / KY home, one category, About
- [ ] AZ story Listen (250 MP3s); EN/RU/KY listen off as intended
- [ ] Discoveries only if you published with `--with-discoveries`

## Related

- Publish steps: [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md)
- i18n notes: [i18n/README.md](i18n/README.md)
