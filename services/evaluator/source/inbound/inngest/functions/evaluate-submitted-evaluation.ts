import { inngest } from "../../../infrastructure/inngest/client.js";
import { flowRunRequestedEventName } from "../../../infrastructure/inngest/events.js";

export const evaluateSubmittedEvaluation = inngest.createFunction(
  {
    id: "evaluate-flow-run",
    triggers: [{ event: flowRunRequestedEventName }],
  },
  async ({ event, step }) => {
    return step.run("acknowledge flow run", () => ({
      flowId: event.data.flowId,
      status: "received",
    }));
  },
);
