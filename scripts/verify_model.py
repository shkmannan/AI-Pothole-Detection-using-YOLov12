import json
import os
from pathlib import Path
import sys


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "roadsight.settings")

    import django

    django.setup()

    from detector.services import get_model_status

    status = get_model_status()
    print(json.dumps(status, indent=2))

    if status.get("ready"):
        return 0

    detail = status.get("detail") or "Model is not ready."
    print(detail, file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
