from __future__ import annotations

from io import BytesIO
from tempfile import NamedTemporaryFile
from typing import Any

from PIL import Image

from source.models import BoundingBox, OCRBlock, OCRDocument

IMAGE_SUFFIXES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/tiff": ".tiff",
}


class PaddleOCREngine:
    """PaddleOCR-backed document structure parser."""

    def __init__(self, pipeline: Any | None = None) -> None:
        """Create a PaddleOCR engine.

        Parameters
        ----------
        pipeline
            Optional prebuilt Paddle pipeline. Tests may provide a fake
            pipeline to avoid loading PaddleOCR models.
        """
        self._pipeline = pipeline

    def parse(self, content: bytes, mime_type: str) -> OCRDocument:
        """Parse image content into normalized OCR blocks.

        Parameters
        ----------
        content
            Raw uploaded image bytes.
        mime_type
            MIME type validated by the controller.

        Returns
        -------
        OCRDocument
            Normalized OCR document.
        """
        image = Image.open(BytesIO(content))
        width, height = image.size

        with NamedTemporaryFile(
            suffix=IMAGE_SUFFIXES[mime_type]
        ) as image_file:
            image.save(image_file.name)
            results = self._get_pipeline().predict(input=image_file.name)

        blocks = []
        for result in results:
            result_json = getattr(result, "json", result)
            result_json = result_json.get("res", result_json)

            # Normalize Paddle's structure blocks into the service OCR model.
            for block in result_json.get("parsing_res_list", []):
                text = str(block.get("block_content") or "").strip()
                raw_bounds = block.get("block_bbox") or block.get("bbox")

                if not text or raw_bounds is None or len(raw_bounds) != 4:
                    continue

                left, top, right, bottom = [int(value) for value in raw_bounds]
                confidence = block.get("confidence")

                blocks.append(
                    OCRBlock(
                        label=str(block.get("block_label") or "text"),
                        text=text,
                        bounds=BoundingBox(
                            x=left,
                            y=top,
                            width=right - left,
                            height=bottom - top,
                        ),
                        confidence=(
                            confidence
                            if isinstance(confidence, int | float)
                            else None
                        ),
                    )
                )

        return OCRDocument(width=width, height=height, blocks=blocks)

    def _get_pipeline(self) -> Any:
        """Return a lazily-created PaddleOCR pipeline.

        Returns
        -------
        Any
            PaddleOCR PP-StructureV3 pipeline.
        """
        if self._pipeline is None:
            from paddleocr import PPStructureV3

            self._pipeline = PPStructureV3(
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )

        return self._pipeline
