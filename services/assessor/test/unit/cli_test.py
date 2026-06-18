import pytest

from source import cli


def test_help_describes_available_commands(capsys) -> None:
    """Verify top-level help is available."""
    with pytest.raises(SystemExit) as error:
        cli.main(["--help"])

    assert error.value.code == 0
    output = capsys.readouterr().out
    assert "Run the assessor service." in output
    assert "serve" in output


def test_default_command_serves(monkeypatch) -> None:
    """Verify no subcommand defaults to serving the application."""
    calls = []

    monkeypatch.setattr(
        cli.commands.uvicorn,
        "run",
        lambda *args, **kwargs: calls.append((args, kwargs)),
    )

    assert cli.main([]) == 0

    assert calls == [
        (
            ("source.main:run",),
            {"factory": True, "host": "0.0.0.0", "port": 9000},
        )
    ]
