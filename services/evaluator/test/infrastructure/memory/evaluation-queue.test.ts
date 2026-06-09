import { describe, expect, it } from "vitest";

import {
  createCompositeEvaluationQueue,
  createImmediateEvaluationQueue,
} from "../../../source/infrastructure/memory/evaluation-queue.js";

import type { FlowRun } from "../../../source/application/flows.js";

const flowRun: FlowRun = {
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
};

describe("immediate evaluation queue", () => {
  it("runs flow requests immediately", async () => {
    const executed: FlowRun[] = [];
    const queue = createImmediateEvaluationQueue(async (input) => {
      executed.push(input);
    });

    await queue.enqueueFlow(flowRun);

    expect(executed).toEqual([flowRun]);
  });
});

describe("composite evaluation queue", () => {
  it("passes flow requests to each queue in order", async () => {
    const events: string[] = [];
    const queue = createCompositeEvaluationQueue([
      {
        async enqueueFlow(input) {
          events.push(`first:${input.flowId}`);
        },
      },
      {
        async enqueueFlow(input) {
          events.push(`second:${input.flowId}`);
        },
      },
    ]);

    await queue.enqueueFlow(flowRun);

    expect(events).toEqual(["first:flow-1", "second:flow-1"]);
  });
});
