from __future__ import annotations

import sys
import types


sys.modules.setdefault(
    "fitz",
    types.SimpleNamespace(Document=object, Matrix=object, csGRAY=object(), open=lambda *_args, **_kwargs: None),
)
