import { evaluationSubmittedEventName } from "./events.js";

import type { Inngest } from "inngest";
import type { EvaluationQueue } from "../../application/submit-evaluation.js";

type InngestClient = Pick<Inngest.Any, "send">;

export function createInngestEvaluationQueue(
  inngest: InngestClient,
): EvaluationQueue {
  return {
    async enqueueEvaluation(input) {
      await inngest.send({
        name: evaluationSubmittedEventName,
        data: input,
      });
    },
  };
}
