# Hostinger deployment

Publish the generated tree under `deployment/`, not the git repo root and not a raw `{lang}/` folder.

## Before every upload

1. Apply chrome / asset stamp if you changed shared CSS/JS or chrome:
   - bump `SITE_ASSET_VERSION` in `tools/chrome_restore.py` when needed
   - run the restore / pin pass you normally use (or `apply_all_html` if that is your workflow)
2. Build the publish copy:

```bash
python tools/build_deployment.py
```

3. Smoke-check locally:

```bash
python tools/full_site_qa.py
```

Upload only when `FAIL=0` (or you understand any remaining WARN).

## What to upload

| Upload this | Do not upload |
|-------------|----------------|
| Contents of `deployment/` | Repo root `sitemap.xml` by itself |
| | Raw `az/` `en/` `ru/` `ky/` trees |
| | `tools/`, `api/`, `.env`, Word/PDF sources |
| | `en/prominent-figures/` (preview only) |

`deployment/` is gitignored. Rebuild it on the machine that uploads.

## Discoveries policy (default: hidden)

By default:

- `build_deployment.py` skips `{lang}/discoveries/` and `{lang}/discovery-articles/`, strips Discoveries chrome from publish HTML, and keeps Discoveries out of `deployment/sitemap.xml`
- `tools/chrome_restore.write_public_seo_files()` writes the **repo** `sitemap.xml` **without** Discoveries URLs (same policy), so root SEO matches what Hostinger should serve

Locale trees in the repo still keep Discoveries for local preview (nav/pages). Human `{lang}/sitemap.html` may still list Discoveries locally; the public XML sitemap does not until you opt in.

To publish Discoveries intentionally:

```bash
set BIRINCI_PUBLISH_DISCOVERIES=1
python -c "import sys; sys.path.insert(0,'tools'); from chrome_restore import write_public_seo_files; write_public_seo_files()"
python tools/build_deployment.py --with-discoveries
```

After upload, confirm live `sitemap.xml` matches that choice (0 Discoveries locs by default).

## Asset cache bust

Shared CSS/JS use `?v=<SITE_ASSET_VERSION>`. After changing `assets/site.css`, `assets/site.js`, or inventions CSS/JS, bump the stamp, re-pin HTML, rebuild `deployment/`, then hard-refresh the browser.

## Auth / API (optional, later)

Static site and API are separate. Keep `AUTH_UI_ENABLED=false` in `assets/site.js` until:

- VPS `.env` uses `APP_ENV=production` with a strong `SECRET_KEY`, `DEBUG=false`, `COOKIE_SECURE=true`, HTTPS `PUBLIC_BASE_URL`, and MySQL (not SQLite)
- The API process starts successfully under that env (it exits on weak defaults)
- real SMTP is configured
- same-origin `/api` proxy is in place (see `api/README.md`)

Do not ship `api/.env` or mailbox credential files.

## Quick checklist

- [ ] `python tools/build_deployment.py` (Discoveries flag deliberate)
- [ ] `python tools/full_site_qa.py` → FAIL=0 (or `--structural` for a fast gate)
- [ ] Upload **only** `deployment/` contents to web root
- [ ] Live sitemap matches Discoveries publish policy
- [ ] Hard-refresh after asset stamp change
- [ ] Auth UI still off unless API prod hardening is done
- [ ] CI green on the commit you publish (Site QA workflow)
