import type { FlowEvidence } from "../../source/domain/evaluation.js";

export function createFlowEvidence(evidenceId = "evidence-1"): FlowEvidence {
  return {
    evidenceId,
    documentType: "policy_or_contract",
    name: "Quarterly access review policy.pdf",
    originalFile: {
      filename: "Quarterly access review policy.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3,
    },
    metadata: {
      owner: "Internal Audit",
    },
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
  };
}
