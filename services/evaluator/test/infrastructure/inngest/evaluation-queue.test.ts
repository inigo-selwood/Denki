import { describe, expect, it } from "vitest";

import { createInngestEvaluationQueue } from "../../../source/infrastructure/inngest/evaluation-queue.js";
import { evaluationSubmittedEventName } from "../../../source/infrastructure/inngest/events.js";

describe("Inngest evaluation queue", () => {
  it("sends submitted evaluation events", async () => {
    const sent: unknown[] = [];
    const queue = createInngestEvaluationQueue({
      async send(payload) {
        sent.push(payload);
        return {
          ids: ["event-1"],
        };
      },
    });

    await queue.enqueueEvaluation({
      evaluationId: "evaluation-1",
      request: {
        evidence: [
          {
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
        name: evaluationSubmittedEventName,
        data: {
          evaluationId: "evaluation-1",
          request: {
            evidence: [
              {
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
