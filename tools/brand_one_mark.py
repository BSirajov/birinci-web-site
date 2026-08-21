"""Post-build CSS: pearlescent \"1\" mark left of the pearl logo (header + footer).

The website builder rewrites assets/site.css from bytecode. Re-apply this after
sync_shared_assets so the mark survives rebuilds.
"""
from __future__ import annotations

import re

BRAND_BLOCK = """\
.brand {
  --brand-mark: 40px;
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0;
  flex: 0 0 auto;
  flex-grow: 0;
  flex-shrink: 0;
  margin: 0;
  min-width: 0;
  max-width: none;
  width: auto;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.05rem, 1.35vw, 1.28rem);
  color: #fff;
  text-decoration: none;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.brand::before {
  content: "";
  order: 1;
  flex: 0 0 auto;
  width: calc(var(--brand-mark) * 0.58);
  height: var(--brand-mark);
  margin-inline-end: -4px;
  background: url("brand-one.webp") center / contain no-repeat;
}
.brand__logo {
  order: 2;
  width: var(--brand-mark);
  height: var(--brand-mark);
  object-fit: contain;
  flex: 0 0 auto;
  margin-inline-end: 0.35rem;
}
.brand__name {
  order: 3;
  color: #fff;
  white-space: nowrap;
}
"""

FOOTER_LOGO_BLOCK = """\
.footer-logo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  column-gap: 0;
  row-gap: 0.7rem;
  width: max-content;
  max-width: 100%;
  margin-inline: auto;
  text-decoration: none;
  color: #fff;
}
.footer-logo::before {
  content: "";
  order: 1;
  flex: 0 0 auto;
  width: 36px;
  height: 72px;
  margin-inline-end: -6px;
  background: url("brand-one.webp") center / contain no-repeat;
}
.footer-logo:hover {
  color: #fff;
  opacity: 0.94;
}
.footer-logo__img {
  order: 2;
  width: 72px;
  height: 72px;
  object-fit: contain;
}
.footer-logo__text {
  order: 3;
  flex: 1 0 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.18rem;
}
"""

_BRAND_RE = re.compile(
    r"\.brand \{.*?\n\.brand__name \{.*?\n\}",
    re.S,
)
_FOOTER_RE = re.compile(
    r"\.footer-logo \{.*?\n\.footer-logo__text \{.*?\n\}",
    re.S,
)
_MQ_1480_BRAND_RE = re.compile(
    r"(@media \(max-width: 1480px\) \{\n  \.brand \{\n)"
    r"(?:    --brand-mark: 36px;\n)?"
    r"(    font-size: clamp\(0\.98rem, 1\.2vw, 1\.18rem\);\n  \})\n"
    r"(?:  \.brand__logo \{\n    width: 36px;\n    height: 36px;\n  \}\n)?",
)
_MQ_1400_BRAND_RE = re.compile(
    r"(  \.brand \{\n)"
    r"(?:    --brand-mark: 42px;\n)?"
    r"(    grid-column: 2;\n"
    r"    grid-row: 1;\n"
    r"    justify-self: center;\n"
    r"    max-width: 100%;\n"
    r"    font-size: clamp\(1\.1rem, 4\.2vw, 1\.35rem\);\n  \})\n"
    r"(?:  \.brand__logo \{\n    width: 42px;\n    height: 42px;\n  \}\n)?",
)


def ensure_brand_one_mark(css: str) -> str:
    """Inject / restore header + footer brand-one mark rules into site.css text."""
    if not _BRAND_RE.search(css):
        raise ValueError("Could not find .brand block in site.css")
    css = _BRAND_RE.sub(BRAND_BLOCK.rstrip("\n"), css, count=1)

    if not _FOOTER_RE.search(css):
        raise ValueError("Could not find .footer-logo block in site.css")
    css = _FOOTER_RE.sub(FOOTER_LOGO_BLOCK.rstrip("\n"), css, count=1)

    css, n1480 = _MQ_1480_BRAND_RE.subn(
        r"\1    --brand-mark: 36px;\n\2",
        css,
        count=1,
    )
    if not n1480:
        raise ValueError("Could not patch 1480px .brand media query")

    css, n1400 = _MQ_1400_BRAND_RE.subn(
        r"\1    --brand-mark: 42px;\n\2",
        css,
        count=1,
    )
    if not n1400:
        raise ValueError("Could not patch 1400px .brand media query")

    return css
