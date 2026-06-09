import { flowRunRequestedEventName } from "./events.js";

import type { Inngest } from "inngest";
import type { FlowQueue } from "../../application/flows.js";

type InngestClient = Pick<Inngest.Any, "send">;

export function createInngestFlowQueue(inngest: InngestClient): FlowQueue {
  return {
    async enqueueFlow(input) {
      await inngest.send({
        name: flowRunRequestedEventName,
        data: input,
      });
    },
  };
}
