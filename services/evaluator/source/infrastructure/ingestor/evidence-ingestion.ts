import type {
  DocumentIngestionProvider,
  FlowEvidenceUpload,
} from "../../application/flows.js";
import type { EvidenceBlock, FlowEvidence } from "../../domain/evaluation.js";

type CreateIngestorEvidenceIngestionProviderInput = {
  baseUrl: string;
  fetchParse?: typeof fetch;
};

export function createIngestorEvidenceIngestionProvider(
  input: CreateIngestorEvidenceIngestionProviderInput,
): DocumentIngestionProvider {
  const fetchParse = input.fetchParse ?? fetch;
  const parseUrl = new URL("/parse", input.baseUrl);

  return {
    async ingest(upload) {
      const content = upload.content.buffer.slice(
        upload.content.byteOffset,
        upload.content.byteOffset + upload.content.byteLength,
      ) as ArrayBuffer;
      const form = new FormData();
      form.append(
        "file",
        new Blob([content], { type: upload.mimeType }),
        upload.filename,
      );

      const response = await fetchParse(parseUrl, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Ingestor parse failed: ${response.status}`);
      }

      const markup = await response.text();
      const blocks = parseMarkupBlocks(markup);

      return createFlowEvidence(upload, markup, blocks);
    },
  };
}

function createFlowEvidence(
  upload: FlowEvidenceUpload & { evidenceId: string },
  markup: string,
  blocks: EvidenceBlock[],
): FlowEvidence {
  return {
    evidenceId: upload.evidenceId,
    documentType: upload.documentType,
    name: upload.filename,
    originalFile: {
      filename: upload.filename,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
    },
    metadata: upload.metadata,
    ingestion: {
      provider: "ingestor",
      text: blocks.map((block) => String(block.content)).join("\n"),
      blocks,
      usage: {
        markup,
      },
    },
  };
}

function parseMarkupBlocks(markup: string): EvidenceBlock[] {
  const blocks: EvidenceBlock[] = [];
  const elementPattern =
    /<(?<tag>h1|p|li|td|th)\b(?<attributes>[^>]*)>(?<content>.*?)<\/\k<tag>>/gis;

  for (const match of markup.matchAll(elementPattern)) {
    const tag = match.groups?.tag;
    const attributes = match.groups?.attributes;
    const content = match.groups?.content;

    if (
      tag === undefined ||
      attributes === undefined ||
      content === undefined
    ) {
      continue;
    }

    const bounds = parseBounds(readAttribute(attributes, "bounds"));
    if (bounds === undefined) {
      continue;
    }

    const text = stripMarkup(content);
    const sourceLabel = readAttribute(attributes, "source-label");
    const confidence = readAttribute(attributes, "confidence");

    blocks.push({
      blockId: `block:${blocks.length}`,
      type: sourceLabel ?? tag,
      content: text,
      page: 1,
      bbox: {
        page: 1,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
      confidenceLabel: confidence,
    });
  }

  return blocks;
}

function readAttribute(attributes: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedName}="([^"]*)"`, "i");
  const match = pattern.exec(attributes);

  return match?.[1];
}

function parseBounds(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const [left, top, width, height] = value
    .split(",")
    .map((part) => Number(part));

  if (
    left === undefined ||
    top === undefined ||
    width === undefined ||
    height === undefined ||
    ![left, top, width, height].every(Number.isFinite)
  ) {
    return undefined;
  }

  return {
    left,
    top,
    width,
    height,
  };
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}
