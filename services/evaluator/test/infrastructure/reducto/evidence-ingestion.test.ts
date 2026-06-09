import { describe, expect, it } from "vitest";

import { createReductoEvidenceIngestionProviderFromClient } from "../../../source/infrastructure/reducto/evidence-ingestion.js";

describe("Reducto evidence ingestion provider", () => {
  it("maps uploaded parse results into normalized evidence", async () => {
    const provider = createReductoEvidenceIngestionProviderFromClient({
      client: createClient({
        result: {
          type: "full",
          chunks: [
            {
              content: "Access reviews are performed quarterly.",
              embed: "Access reviews are performed quarterly.",
              enriched: null,
              blocks: [
                {
                  type: "Text",
                  content: "Access reviews are performed quarterly.",
                  bbox: {
                    page: 1,
                    left: 0.1,
                    top: 0.2,
                    width: 0.3,
                    height: 0.4,
                  },
                  confidence: "high",
                },
              ],
            },
          ],
        },
      }),
    });

    await expect(provider.ingest(createUpload())).resolves.toMatchObject({
      evidenceId: "evidence-1",
      documentType: "policy_or_contract",
      ingestion: {
        provider: "reducto",
        providerFileId: "reducto://file-1",
        providerJobId: "job-1",
        text: "Access reviews are performed quarterly.",
        blocks: [
          {
            blockId: "chunk:0:block:0",
            type: "Text",
            content: "Access reviews are performed quarterly.",
            page: 1,
            bbox: {
              page: 1,
              left: 0.1,
              top: 0.2,
              width: 0.3,
              height: 0.4,
            },
            confidenceLabel: "high",
          },
        ],
      },
    });
  });

  it("fetches URL-style Reducto parse results before normalizing", async () => {
    const provider = createReductoEvidenceIngestionProviderFromClient({
      client: createClient({
        result: {
          type: "url",
          result_id: "result-1",
          url: "https://example.test/reducto-result.json",
        },
      }),
      fetchResult: async () =>
        new Response(
          JSON.stringify({
            chunks: [
              {
                content: "Invoice total: 100",
                embed: "Invoice total: 100",
                enriched: null,
                blocks: [
                  {
                    type: "Table",
                    content: '{"total":100}',
                    bbox: {
                      page: 2,
                      left: 0.2,
                      top: 0.3,
                      width: 0.4,
                      height: 0.5,
                    },
                    confidence: "high",
                  },
                ],
              },
            ],
            type: "full",
          }),
        ),
    });

    const evidence = await provider.ingest({
      ...createUpload(),
      documentType: "invoice",
    });

    expect(evidence.ingestion.blocks[0]).toMatchObject({
      type: "Table",
      content: {
        total: 100,
      },
      page: 2,
    });
  });
});

function createUpload() {
  return {
    content: new Uint8Array([1, 2, 3]),
    documentType: "policy_or_contract" as const,
    evidenceId: "evidence-1",
    filename: "Quarterly access review policy.pdf",
    metadata: {
      owner: "Internal Audit",
    },
    mimeType: "application/pdf",
    sizeBytes: 3,
  };
}

function createClient(parseResponse: Record<string, unknown>) {
  return {
    async upload() {
      return {
        file_id: "reducto://file-1",
      };
    },
    parse: {
      async run() {
        return {
          duration: 1.2,
          job_id: "job-1",
          studio_link: "https://studio.reducto.ai/job/job-1",
          usage: {
            num_pages: 1,
          },
          ...parseResponse,
        };
      },
    },
  };
}
