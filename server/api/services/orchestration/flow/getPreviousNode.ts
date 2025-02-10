import { Orchestration, Node } from "../types";

export default function getPreviousNode(
  orchestration: Orchestration,
  nodeId: string
): Node[] | null {
  let prevNodes = orchestration.links
    .filter((o) => o["to"] == nodeId)
    .map((o) => o["from"]);
  return prevNodes
    ? orchestration.nodes.filter((o) => prevNodes.includes(o["params"]["id"]))
    : null;
}
