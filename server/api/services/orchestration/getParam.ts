import { OrchestrationConfigs } from "./types";

export default function getParams(
  orchConfigs: OrchestrationConfigs,
  key: string
): string | null {
  return orchConfigs[key] || null;
}
