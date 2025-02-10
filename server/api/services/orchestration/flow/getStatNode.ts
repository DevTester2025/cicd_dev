import { Orchestration, Node } from "../types";

export default function GetStartNode(
  orchestration: Orchestration
): Node | null {
  return orchestration.nodes.find((o) => o["name"] == "StartNode") || null;
}
