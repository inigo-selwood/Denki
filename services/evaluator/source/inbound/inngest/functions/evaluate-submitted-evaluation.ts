import { inngest } from "../../../infrastructure/inngest/client.js";
import { evaluationSubmittedEventName } from "../../../infrastructure/inngest/events.js";

export const evaluateSubmittedEvaluation = inngest.createFunction(
  {
    id: "evaluate-submitted-evaluation",
    triggers: [{ event: evaluationSubmittedEventName }],
  },
  async ({ event, step }) => {
    return step.run("acknowledge submitted evaluation", () => ({
      evaluationId: event.data.evaluationId,
      status: "received",
    }));
  },
);
