from io import BytesIO

from PIL import Image

from source.ocr import PaddleOCREngine


class FakePaddleResult:
    """Fake Paddle result object with a json payload."""

    json = {
        "res": {
            "parsing_res_list": [
                {
                    "block_label": "title",
                    "block_content": "Quarterly Report",
                    "block_bbox": [10, 20, 110, 50],
                    "confidence": 0.9,
                },
                {
                    "block_label": "text",
                    "block_content": "Reviewed by audit",
                    "block_bbox": [10, 60, 150, 80],
                },
            ]
        }
    }


class FakePaddlePipeline:
    """Fake Paddle pipeline for adapter tests."""

    def predict(self, input: str) -> list[FakePaddleResult]:
        """Return stable fake Paddle results.

        Parameters
        ----------
        input
            Temporary image path supplied to the pipeline.

        Returns
        -------
        list[FakePaddleResult]
            Stable fake Paddle results.
        """
        assert input.endswith(".png")

        return [FakePaddleResult()]


def test_paddle_engine_normalizes_structure_results() -> None:
    """Verify Paddle results become normalized OCR documents."""
    image_content = BytesIO()
    Image.new("RGB", (200, 100)).save(image_content, format="PNG")

    engine = PaddleOCREngine(pipeline=FakePaddlePipeline())
    document = engine.parse(
        content=image_content.getvalue(),
        mime_type="image/png",
    )

    assert document.width == 200
    assert document.height == 100
    assert len(document.blocks) == 2
    assert document.blocks[0].label == "title"
    assert document.blocks[0].text == "Quarterly Report"
    assert document.blocks[0].bounds.width == 100
    assert document.blocks[0].bounds.height == 30
    assert document.blocks[0].confidence == 0.9
