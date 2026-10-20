# PHP feedback security follow-up

The canonical endpoint is `tools/mail_feedback.php`; identical copies are published under AZ, EN, RU and KY. German links to the English feedback page.

## Controls

- Server-side UTF-8, scalar-field, control-character and length validation; feedback type allowlist; validated email and HTTP(S)/relative URLs.
- Request limit 6 MiB; attachment limit 5 MiB verified against the actual temporary file. Uploaded array structures and unexpected file fields are rejected.
- Attachment extension must agree with server-detected MIME. Images must have readable image dimensions. Filenames in outgoing MIME headers are generated rather than copied from user input. Files are never saved in the public tree.
- Cross-site browser submissions are rejected using Origin and Fetch Metadata where present. Non-browser clients without these headers remain subject to validation and throttling.
- Shared limit across all locales: five valid submission attempts per client address per 15 minutes, and 60 globally per hour. Failed mail attempts also consume quota. The limiter uses an exclusive filesystem lock, bounded state, expiry, and a private temporary file; storage errors fail closed with 503. Responses include Retry-After on 429. Untrusted forwarded-IP headers are ignored.
- Localized rate-limit and length messages retain entered feedback.

## Runtime tests

`tools/test_php_feedback.py` starts an actual loopback PHP HTTP server and submits multipart uploads. A test-only auto-prepend file intercepts the namespaced mail function and writes an isolated local capture; no real email is sent and no test bypass is present in production code. Separate PHP processes test concurrent quota enforcement.

Run with PHP and its fileinfo extension installed:

```text
python -m pytest tools/test_php_feedback.py -q
```

Set `PHP_BIN` to the PHP executable if it is not on PATH. CI explicitly checks PHP/fileinfo availability and sets PHP_BIN, so this suite cannot silently skip in CI. The portable local runtime was obtained from the official PHP download service and remains under the untracked temporary directory.

## Hosting and remaining limits

PHP must enable fileinfo, permit writable private temporary storage and mail(), and allow upload_max_filesize=5M or higher and post_max_size=6M or higher. The application enforces its own stricter limits regardless of higher hosting values. Hostinger's effective REMOTE_ADDR should represent the visitor; if a proxy supplies a shared address, the limiter conservatively shares that quota. Do not trust forwarded headers without a documented trusted-proxy configuration.

Hostinger is configured for PHP 8.3. The endpoint passed 32 integration cases on both PHP 8.3.35 and 8.4.26 before release. The hosting panel exposes very large global upload limits, so the generated `.htaccess` scopes 5M upload and 6M POST limits, with display_errors disabled, to the feedback PHP filename under LiteSpeed. This avoids changing unrelated hosting settings. LiteSpeed documents these PHP overrides at https://docs.litespeedtech.com/lsws/extapp/php/advanced/.

The limiter is appropriate for this single-host deployment; distributed deployments need shared rate-limit storage. Host-level limits remain necessary for bandwidth/connection floods because PHP receives request bodies before running the script. MIME validation does not provide malware scanning or guarantee that a PDF is harmless. Real mailbox delivery is not exercised by the local suite.

This follow-up addresses the PHP security findings. Full-generator reproducibility and home-page rendering performance remain separate open QA items from the comprehensive report.
