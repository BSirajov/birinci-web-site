"""Local dev entry point — runs unified AZ/KY TTS proxy."""
from __future__ import annotations

import sys
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))

from tts_proxy_server import main  # noqa: E402

if __name__ == "__main__":
    main()
