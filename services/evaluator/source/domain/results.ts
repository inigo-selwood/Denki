import { rollUpConditionVerdict, rollUpEvaluationStatus } from "./rollups.js";

import type {
  ConditionResult,
  CriterionResult,
  EvaluationResult,
} from "./evaluation.js";

type CreateConditionResultInput = {
  conditionId: string;
  criteria: CriterionResult[];
};

type CreateEvaluationResultInput = {
  flowId: string;
  conditions: ConditionResult[];
};

export function createConditionResult(
  input: CreateConditionResultInput,
): ConditionResult {
  return {
    conditionId: input.conditionId,
    verdict: rollUpConditionVerdict(input.criteria),
    criteria: input.criteria,
  };
}

export function createEvaluationResult(
  input: CreateEvaluationResultInput,
): EvaluationResult {
  return {
    flowId: input.flowId,
    status: rollUpEvaluationStatus(input.conditions),
    conditions: input.conditions,
  };
}
