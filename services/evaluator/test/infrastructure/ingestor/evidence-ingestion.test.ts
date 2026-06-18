import { describe, expect, it } from "vitest";

import { createIngestorEvidenceIngestionProvider } from "../../../source/infrastructure/ingestor/evidence-ingestion.js";

describe("Ingestor evidence ingestion provider", () => {
  it("maps ingestor markup into normalized evidence", async () => {
    const provider = createIngestorEvidenceIngestionProvider({
      baseUrl: "http://ingestor.test",
      fetchParse: async (input, init) => {
        expect(String(input)).toBe("http://ingestor.test/parse");
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(FormData);

        return new Response(
          '<html><body><h1 bounds="1,2,30,40" confidence="0.95" source-label="title">Quarterly Report</h1><p bounds="5,6,70,80" source-label="text">Total &amp; Fees</p></body></html>\n',
          {
            headers: {
              "content-type": "text/html",
            },
          },
        );
      },
    });

    const evidence = await provider.ingest({
      content: new Uint8Array([1, 2, 3]),
      documentType: "report_or_statement",
      evidenceId: "evidence-1",
      filename: "report.png",
      metadata: {
        owner: "Internal Audit",
      },
      mimeType: "image/png",
      sizeBytes: 3,
    });

    expect(evidence).toMatchObject({
      documentType: "report_or_statement",
      evidenceId: "evidence-1",
      ingestion: {
        provider: "ingestor",
        text: "Quarterly Report\nTotal & Fees",
        blocks: [
          {
            blockId: "block:0",
            type: "title",
            content: "Quarterly Report",
            page: 1,
            bbox: {
              page: 1,
              left: 1,
              top: 2,
              width: 30,
              height: 40,
            },
            confidenceLabel: "0.95",
          },
          {
            blockId: "block:1",
            type: "text",
            content: "Total & Fees",
          },
        ],
      },
      metadata: {
        owner: "Internal Audit",
      },
      name: "report.png",
      originalFile: {
        filename: "report.png",
        mimeType: "image/png",
        sizeBytes: 3,
      },
    });
  });

  it("throws when ingestor parse fails", async () => {
    const provider = createIngestorEvidenceIngestionProvider({
      baseUrl: "http://ingestor.test",
      fetchParse: async () => new Response("nope", { status: 415 }),
    });

    await expect(
      provider.ingest({
        content: new Uint8Array([1, 2, 3]),
        documentType: "generic_document",
        evidenceId: "evidence-1",
        filename: "report.exe",
        metadata: {},
        mimeType: "application/x-msdownload",
        sizeBytes: 3,
      }),
    ).rejects.toThrow("Ingestor parse failed: 415");
  });
});
