from __future__ import annotations

from collections.abc import Sequence

from source.cli import commands as commands
from source.cli.parser import build_parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run the assessor command-line interface.

    Parameters
    ----------
    argv
        Optional command-line arguments. Defaults to ``sys.argv``.

    Returns
    -------
    int
        Process exit code.
    """
    parser = build_parser()
    namespace = parser.parse_args(argv)
    namespace.handler(namespace)
    return 0
