import { Orchestration, Node, Link } from "../types";

// x1, y1 are fixed positions determined.
function getRelativeNodePosition(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  let p = "";

  p += y1 == y2 ? "" : y1 < y2 ? "bottom" : "top";
  p += x1 == x2 ? "" : x1 < x2 ? "-right" : "-left";

  return p;
}

export function getNextNodebyPosition(
  orchestration: Orchestration,
  nodeId: string,
  position:
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
): Node[] | null {
  let nextNodes = orchestration.links.filter((o) => o["from"] == nodeId);

  if (nextNodes && nextNodes.length > 0) {
    // key is positions top, right, top-right and so...
    let edgePositions: { [key: string]: Link[] } = {};

    // To determine the position to which the relative position (top, right...)
    // should be determined. Current node's input position is considered as
    // fixed position
    let prevLink = orchestration.links.filter((l) => l["to"] == nodeId);

    if (prevLink && prevLink.length > 0) {
      let fixedPostion = prevLink[0].points[1]["x"];
      let fixedPostionAxis: "x" | "y" = "x";
      const altFixedPostion = prevLink[0].points[1]["y"];
      let altFixedPostionAxis: "x" | "y" = "y";

      if (
        nextNodes.every(
          (val, i, arr) => val.points[0]["x"] === arr[0]["points"][0]["x"]
        )
      ) {
        fixedPostion = nextNodes[0].points[0]["x"];
        fixedPostionAxis = "x";
        altFixedPostionAxis = "y";
      }
      if (
        nextNodes.every(
          (val, i, arr) => val.points[0]["y"] === arr[0]["points"][0]["y"]
        )
      ) {
        fixedPostion = nextNodes[0].points[0]["y"];
        fixedPostionAxis = "y";
        altFixedPostionAxis = "x";
      }

      nextNodes.forEach((link) => {
        let from = link.points[0];

        let x1 = fixedPostionAxis == "x" ? fixedPostion : altFixedPostion;
        let y1 = fixedPostionAxis == "y" ? fixedPostion : altFixedPostion;

        let position = getRelativeNodePosition(x1, y1, from.x, from.y);

        if (edgePositions[position] && edgePositions[position].length > 0) {
          edgePositions[position].push(link);
        } else {
          edgePositions[position] = [link];
        }
      });

      let toNodes = edgePositions[position];

      return toNodes
        ? orchestration.nodes.filter(
          (o) => toNodes.filter((l) => l.to == o["params"]["id"]).length > 0
        )
        : null;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

export default function getNextNode(
  orchestration: Orchestration,
  nodeId: string
): Node[] | null {
  let nextNodes = orchestration.links
    .filter((o) => o["from"] == nodeId)
    .map((o) => o["to"]);
  return nextNodes
    ? orchestration.nodes.filter((o) => nextNodes.includes(o["params"]["id"]))
    : null;
}


export function getPrevNode(
  orchestration: Orchestration,
  nodeId: string
): Node[] | null {
  let nextNodes = orchestration.links
    .filter((o) => o["to"] == nodeId)
    .map((o) => o["from"]);
  return nextNodes
    ? orchestration.nodes.filter((o) => nextNodes.includes(o["params"]["id"]))
    : null;
}