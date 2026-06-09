import { describe, expect, it } from "vitest";

import { createInngestFlowQueue } from "../../../source/infrastructure/inngest/evaluation-queue.js";
import { flowRunRequestedEventName } from "../../../source/infrastructure/inngest/events.js";

describe("Inngest flow queue", () => {
  it("sends flow run events", async () => {
    const sent: unknown[] = [];
    const queue = createInngestFlowQueue({
      async send(payload) {
        sent.push(payload);
        return {
          ids: ["event-1"],
        };
      },
    });

    await queue.enqueueFlow({
      flowId: "flow-1",
      request: {
        evidence: [
          {
            evidenceId: "evidence-1",
            name: "Quarterly access review policy.pdf",
            content: "Access reviews are performed quarterly.",
          },
        ],
        conditions: [
          {
            statement: "Access reviews are performed quarterly.",
            criteria: ["Evidence shows a quarterly access review."],
          },
        ],
      },
    });

    expect(sent).toEqual([
      {
        name: flowRunRequestedEventName,
        data: {
          flowId: "flow-1",
          request: {
            evidence: [
              {
                evidenceId: "evidence-1",
                name: "Quarterly access review policy.pdf",
                content: "Access reviews are performed quarterly.",
              },
            ],
            conditions: [
              {
                statement: "Access reviews are performed quarterly.",
                criteria: ["Evidence shows a quarterly access review."],
              },
            ],
          },
        },
      },
    ]);
  });
});
