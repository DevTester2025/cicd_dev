import { Orchestration, OrchestrationNodeHandlerResponse } from "../types";

export default class Store {
  private orchestration: Orchestration;

  private meta = {};
  private responses: { [key: string]: OrchestrationNodeHandlerResponse } = {};

  constructor(orchestration: Orchestration) {
    this.orchestration = orchestration;
  }

  getOrchestration(): Orchestration {
    return this.orchestration;
  }

  addResponse(key: string, value: OrchestrationNodeHandlerResponse) {
    this.responses[key] = value;
  }

  getResponse(key: string): OrchestrationNodeHandlerResponse | null {
    return this.responses[key] || null;
  }

  addMeta(key: string, value: any) {
    this.meta[key] = value;
  }

  getMeta(key: string): any {
    return this.meta[key] || null;
  }
}
