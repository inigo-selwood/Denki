import Reducto, { toFile } from "reductoai";

import type {
  DocumentIngestionProvider,
  FlowEvidenceUpload,
} from "../../application/flows.js";
import type { EvidenceBlock, FlowEvidence } from "../../domain/evaluation.js";
import type { ParseResponse } from "reductoai/resources/shared.js";

type ReductoClient = {
  parse: {
    run(
      input: Record<string, unknown>,
    ): Promise<ParseResponse | { job_id: string }>;
  };
  upload(input: Record<string, unknown>): Promise<{ file_id: string }>;
};

type CreateReductoEvidenceIngestionProviderInput = {
  apiKey: string;
  environment?: "production" | "eu" | "au";
  fetchResult?: typeof fetch;
};

export function createReductoEvidenceIngestionProvider(
  input: CreateReductoEvidenceIngestionProviderInput,
): DocumentIngestionProvider {
  return createReductoEvidenceIngestionProviderFromClient({
    client: new Reducto({
      apiKey: input.apiKey,
      environment: input.environment ?? "production",
    }) as unknown as ReductoClient,
    fetchResult: input.fetchResult,
  });
}

export function createReductoEvidenceIngestionProviderFromClient(input: {
  client: ReductoClient;
  fetchResult?: typeof fetch;
}): DocumentIngestionProvider {
  const fetchResult = input.fetchResult ?? fetch;

  return {
    async ingest(upload) {
      const uploadedFile = await toFile(upload.content, upload.filename, {
        type: upload.mimeType,
      });
      const uploaded = await input.client.upload({
        file: uploadedFile as unknown as string,
      });
      const parsed = await input.client.parse.run({
        input: uploaded.file_id,
        formatting: {
          table_output_format: "jsonbbox",
        },
        retrieval: {
          chunking: {
            chunk_mode: "block",
          },
        },
        settings: {
          extraction_mode: "hybrid",
          return_ocr_data: false,
        },
        spreadsheet: {
          clustering: "fast",
          include: ["cell_colors", "formula", "dropdowns"],
          split_large_tables: {
            enabled: true,
            size: 50,
          },
        },
      });

      if (!isParseResponse(parsed)) {
        throw new Error("Reducto async parse responses are not supported.");
      }

      const chunks = await getParseChunks(parsed, fetchResult);
      const blocks = chunks.flatMap((chunk, chunkIndex) =>
        chunk.blocks.map((block, blockIndex) =>
          normalizeBlock(block, chunkIndex, blockIndex),
        ),
      );

      return createFlowEvidence(upload, uploaded.file_id, parsed, blocks);
    },
  };
}

async function getParseChunks(
  parsed: ParseResponse,
  fetchResult: typeof fetch,
): Promise<ParseResponse.FullResult.Chunk[]> {
  if (parsed.result.type === "full") {
    return parsed.result.chunks;
  }

  const response = await fetchResult(parsed.result.url);

  if (!response.ok) {
    throw new Error(
      `Could not fetch Reducto parse result: ${response.status}`,
    );
  }

  const result = (await response.json()) as
    | ParseResponse.FullResult
    | ParseResponse.FullResult.Chunk[];

  return Array.isArray(result) ? result : result.chunks;
}

function createFlowEvidence(
  upload: FlowEvidenceUpload & { evidenceId: string },
  providerFileId: string,
  parsed: ParseResponse,
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
      provider: "reducto",
      providerFileId,
      providerJobId: parsed.job_id,
      studioLink: parsed.studio_link ?? undefined,
      durationSeconds: parsed.duration,
      usage: parsed.usage as unknown as Record<string, unknown>,
      text: blocks
        .map((block) => stringifyBlockContent(block.content))
        .join("\n"),
      blocks,
    },
  };
}

function normalizeBlock(
  block: ParseResponse.FullResult.Chunk.Block,
  chunkIndex: number,
  blockIndex: number,
): EvidenceBlock {
  const content = parseBlockContent(block.content);

  return {
    blockId: `chunk:${chunkIndex}:block:${blockIndex}`,
    type: block.type,
    content,
    page: block.bbox.page,
    bbox: {
      page: block.bbox.page,
      left: block.bbox.left,
      top: block.bbox.top,
      width: block.bbox.width,
      height: block.bbox.height,
    },
    confidenceLabel: block.confidence ?? undefined,
    sourceText:
      typeof content === "string" && content !== block.content
        ? block.content
        : undefined,
  };
}

function parseBlockContent(content: string) {
  try {
    const parsed: unknown = JSON.parse(content);

    if (
      parsed !== null &&
      (Array.isArray(parsed) || typeof parsed === "object")
    ) {
      return parsed as Record<string, unknown> | unknown[];
    }
  } catch {
    return content;
  }

  return content;
}

function stringifyBlockContent(content: EvidenceBlock["content"]): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function isParseResponse(
  response: ParseResponse | { job_id: string },
): response is ParseResponse {
  return "result" in response;
}
