# Project consistency audit

Pages/lang: {'az': 24, 'en': 25, 'ru': 24, 'ky': 24, 'de': 25}
Stories/lang: {'az': 251, 'en': 246, 'ru': 246, 'ky': 246, 'de': 246}
Categories/lang: {'az': 12, 'en': 12, 'ru': 12, 'ky': 12, 'de': 12}
Findings: {'info': 23}

## ERROR (0)

_None._

## WARN (0)

_None._

## INFO (23)

- **[page_parity]** `az,ru,ky,de` `prominent-figures/index.html` — EN-only draft (noindex preview); intentionally missing in az, ru, ky, de
- **[stories]** `az` `flowers` — AZ-only catalog stem (policy); not in en
- **[stories]** `az` `my-lifes-journey` — AZ-only catalog stem (policy); not in en
- **[stories]** `az` `pandemic-and-quarantine` — AZ-only catalog stem (policy); not in en
- **[stories]** `az` `reflections` — AZ-only catalog stem (policy); not in en
- **[stories]** `az` `time-has-passed` — AZ-only catalog stem (policy); not in en
- **[stories]** `az` `flowers` — AZ-only catalog stem (policy); not in ru
- **[stories]** `az` `my-lifes-journey` — AZ-only catalog stem (policy); not in ru
- **[stories]** `az` `pandemic-and-quarantine` — AZ-only catalog stem (policy); not in ru
- **[stories]** `az` `reflections` — AZ-only catalog stem (policy); not in ru
- **[stories]** `az` `time-has-passed` — AZ-only catalog stem (policy); not in ru
- **[stories]** `az` `flowers` — AZ-only catalog stem (policy); not in ky
- **[stories]** `az` `my-lifes-journey` — AZ-only catalog stem (policy); not in ky
- **[stories]** `az` `pandemic-and-quarantine` — AZ-only catalog stem (policy); not in ky
- **[stories]** `az` `reflections` — AZ-only catalog stem (policy); not in ky
- **[stories]** `az` `time-has-passed` — AZ-only catalog stem (policy); not in ky
- **[stories]** `de` `stem-coverage` — DE has 246 stems; AZ has 251; AZ-only policy=5; unexpected missing vs AZ=0; extra vs AZ=0
- **[stories]** `de` `flowers` — AZ-only catalog stem (policy); not in DE
- **[stories]** `de` `my-lifes-journey` — AZ-only catalog stem (policy); not in DE
- **[stories]** `de` `pandemic-and-quarantine` — AZ-only catalog stem (policy); not in DE
- **[stories]** `de` `reflections` — AZ-only catalog stem (policy); not in DE
- **[stories]** `de` `time-has-passed` — AZ-only catalog stem (policy); not in DE
- **[assets]** `*` `site.js` — Consistent site.js version: 20261119langswitch1

