import { RequestSchema } from "./contracts/request";
import { TaskSchema } from "./contracts/task";
import { ResultSchema } from "./contracts/result";
import { ResponseSchema } from "./contracts/response";
import { EventSchema } from "./contracts/event";
import { StateSchema } from "./contracts/state";
import type { ZodTypeAny } from "zod";
import type { RequestContract, TaskContract, ResultContract, ResponseContract, EventContract, StateContract } from "./types";

export type ContractType = "request" | "task" | "result" | "response" | "event" | "state";

const validators: Record<ContractType, ZodTypeAny> = {
  request: RequestSchema,
  task: TaskSchema,
  result: ResultSchema,
  response: ResponseSchema,
  event: EventSchema,
  state: StateSchema,
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: unknown;
}

export function validateContract(type: ContractType, data: unknown): ValidationResult {
  const schema = validators[type];
  if (!schema) {
    return { valid: false, errors: [`Unknown contract type: ${type}`], data: null };
  }
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [], data: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`),
    data: null,
  };
}

export function assertContract<T>(type: ContractType, data: unknown): T {
  const { valid, errors, data: parsed } = validateContract(type, data);
  if (!valid) {
    throw new Error(`Contract validation failed [${type}]: ${errors.join("; ")}`);
  }
  return parsed as T;
}
