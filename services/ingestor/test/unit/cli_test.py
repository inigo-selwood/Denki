from pathlib import Path

import pytest
from PIL import Image

from source import cli


def _write_image(path: Path) -> None:
    """Write a small white PNG fixture."""
    Image.new("RGB", (64, 64), "white").save(path)


def test_help_describes_available_commands(capsys) -> None:
    """Verify top-level help is available."""
    with pytest.raises(SystemExit) as error:
        cli.main(["--help"])

    assert error.value.code == 0
    output = capsys.readouterr().out
    assert "Run the ingestor service or parse a document image." in output
    assert "serve" in output
    assert "parse-annotate" in output


def test_parse_help_describes_image_and_output(capsys) -> None:
    """Verify parse-annotate help is available."""
    with pytest.raises(SystemExit) as error:
        cli.main(["parse-annotate", "--help"])

    assert error.value.code == 0
    output = capsys.readouterr().out
    assert "image file to parse" in output
    assert "--output" in output
    assert "--format" in output
    assert "--open" in output


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
            {"factory": True, "host": "0.0.0.0", "port": 8000},
        )
    ]


def test_parse_writes_html_to_output(tmp_path, monkeypatch) -> None:
    """Verify parse writes service HTML to an output file."""
    image_path = tmp_path / "document.png"
    output_path = tmp_path / "document.html"
    image_path.write_bytes(b"image-content")

    def fake_parse(content: bytes, mime_type: str) -> str:
        assert content == b"image-content"
        assert mime_type == "image/png"
        return "<html><body></body></html>\n"

    monkeypatch.setattr(cli.commands.services, "parse", fake_parse)

    assert (
        cli.main(
            [
                "parse-annotate",
                str(image_path),
                "--format",
                "html",
                "--output",
                str(output_path),
            ]
        )
        == 0
    )
    assert output_path.read_text(encoding="utf-8") == (
        "<html><body></body></html>\n"
    )


def test_parse_writes_image_overlay_to_output(tmp_path, monkeypatch) -> None:
    """Verify parse writes a marked-up image overlay by default."""
    image_path = tmp_path / "document.png"
    output_path = tmp_path / "document.overlay.png"
    _write_image(image_path)

    monkeypatch.setattr(
        cli.commands.services,
        "parse",
        lambda content, mime_type: (
            '<html><body><p bounds="10,10,20,20" '
            'source-label="text">Total</p></body></html>\n'
        ),
    )

    assert (
        cli.main(
            [
                "parse-annotate",
                str(image_path),
                "--output",
                str(output_path),
            ]
        )
        == 0
    )

    with Image.open(output_path) as image:
        assert image.size == (64, 64)
        assert image.getpixel((10, 10)) != (255, 255, 255)


def test_parse_opens_output_file(tmp_path, monkeypatch) -> None:
    """Verify parse can open an output file in the browser."""
    image_path = tmp_path / "document.png"
    output_path = tmp_path / "document.html"
    opened = []
    image_path.write_bytes(b"image-content")

    monkeypatch.setattr(
        cli.commands.services,
        "parse",
        lambda content, mime_type: "<html><body></body></html>\n",
    )
    monkeypatch.setattr(cli.commands.webbrowser, "open", opened.append)

    assert (
        cli.main(
            [
                "parse-annotate",
                str(image_path),
                "--format",
                "html",
                "--output",
                str(output_path),
                "--open",
            ]
        )
        == 0
    )

    assert opened == [output_path.resolve().as_uri()]


def test_parse_open_writes_image_to_cache_output_by_default(
    tmp_path, monkeypatch
) -> None:
    """Verify open writes image output to a generated cache path by default."""
    image_path = tmp_path / "document.png"
    temp_output_dir = tmp_path / ".cache" / "outputs"
    _write_image(image_path)

    monkeypatch.setattr(cli.commands, "TEMP_OUTPUT_DIR", temp_output_dir)
    monkeypatch.setattr(
        cli.commands.services,
        "parse",
        lambda content, mime_type: (
            '<html><body><p bounds="10,10,20,20" '
            'source-label="text">Total</p></body></html>\n'
        ),
    )

    opened = []
    monkeypatch.setattr(cli.commands.webbrowser, "open", opened.append)

    assert cli.main(["parse-annotate", str(image_path), "--open"]) == 0

    output_path = temp_output_dir / "document.png"
    assert opened == [output_path.resolve().as_uri()]
    with Image.open(output_path) as image:
        assert image.size == (64, 64)


def test_parse_open_writes_html_to_cache_output(tmp_path, monkeypatch) -> None:
    """Verify open writes HTML to a generated cache output path."""
    image_path = tmp_path / "document.png"
    temp_output_dir = tmp_path / ".cache" / "outputs"
    opened = []
    image_path.write_bytes(b"image-content")

    monkeypatch.setattr(cli.commands, "TEMP_OUTPUT_DIR", temp_output_dir)
    monkeypatch.setattr(
        cli.commands.services,
        "parse",
        lambda content, mime_type: "<html><body></body></html>\n",
    )
    monkeypatch.setattr(cli.commands.webbrowser, "open", opened.append)

    assert (
        cli.main(
            ["parse-annotate", str(image_path), "--format", "html", "--open"]
        )
        == 0
    )

    output_path = temp_output_dir / "document.html"
    assert opened == [output_path.resolve().as_uri()]
    assert output_path.read_text(encoding="utf-8") == (
        "<html><body></body></html>\n"
    )


def test_parse_writes_html_to_stdout(tmp_path, monkeypatch, capsys) -> None:
    """Verify parse writes service HTML to stdout when requested."""
    image_path = tmp_path / "document.png"
    image_path.write_bytes(b"image-content")

    monkeypatch.setattr(
        cli.commands.services,
        "parse",
        lambda content, mime_type: "<html><body></body></html>\n",
    )

    assert (
        cli.main(["parse-annotate", str(image_path), "--format", "html"]) == 0
    )
    assert capsys.readouterr().out == "<html><body></body></html>\n"


def test_parse_rejects_default_image_format_without_file_target(
    tmp_path, capsys
) -> None:
    """Verify image output requires a file output target."""
    image_path = tmp_path / "document.png"
    _write_image(image_path)

    with pytest.raises(SystemExit) as error:
        cli.main(["parse-annotate", str(image_path)])

    assert error.value.code == 2
    assert "parse-annotate: --format image requires --output or --open" in (
        capsys.readouterr().err
    )


def test_parse_rejects_unknown_mime_type() -> None:
    """Verify parse exits when MIME type cannot be inferred."""
    with pytest.raises(SystemExit) as error:
        cli.main(["parse-annotate", str(Path("document")), "--format", "html"])

    assert str(error.value) == "Could not determine image MIME type: document"
