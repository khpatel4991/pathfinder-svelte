import type {
  GraphAlgorithm,
  NodeCoordinates,
  VisualizerNode,
  GraphAlgorithmResults,
  AlgorithmFn,
} from "../types";

// Performs Dijkstra's algorithm; returns *all* nodes in the order
// in which they were visited. Also makes nodes point back to their
// previous node, effectively allowing us to compute the shortest path
export function buildGraph(
  rows: number,
  columns: number,
  startNodeCoordinates: NodeCoordinates,
  targetNodeCoordinates: NodeCoordinates,
  wallNodeIds = new Set<string>()
): VisualizerNode[][] {
  return Array.from(Array(rows), (_, i) =>
    Array.from<any, VisualizerNode>(Array(columns), (__, j) => ({
      id: `n:${i}:${j}`,
      row: i,
      column: j,
      isStart: i === startNodeCoordinates[0] && j === startNodeCoordinates[1],
      isFinish:
        i === targetNodeCoordinates[0] && j === targetNodeCoordinates[1],
      isWall: wallNodeIds.has(`n:${i}:${j}`),
      distance: Number.POSITIVE_INFINITY,
      isVisited: false,
      isOnShortestPath: false,
      isOnQueue: false,
    }))
  );
}

export function workAlgorithm(
  rows: number,
  columns: number,
  startNodeCoords: NodeCoordinates,
  endNodeCoords: NodeCoordinates,
  wallCoords = new Set<string>(),
  maxWanted = Number.POSITIVE_INFINITY,
  algorithm: GraphAlgorithm,
): GraphAlgorithmResults {
  const g = buildGraph(
    rows,
    columns,
    startNodeCoords,
    endNodeCoords,
    wallCoords
  );
  const map: Record<GraphAlgorithm, AlgorithmFn> = {
    astar: astar,
    dijkstra: dijkstraOg,
  };
  const { queue, visitedNodesInOrder } = map[algorithm].call(
    this,
    g,
    startNodeCoords,
    endNodeCoords,
    maxWanted
  );
  const nodesInShortestPathOrder = getNodesInShortestPathOrder(
    g,
    g[endNodeCoords[0]][endNodeCoords[1]]
  );
  return {
    nodesInShortestPathOrder,
    queue,
    visitedNodesInOrder,
  };
}

// by backtracking from the finish node.
export function astar(
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number
): Pick<GraphAlgorithmResults, "visitedNodesInOrder" | "queue"> {
  const visitedNodesInOrder: VisualizerNode[] = [];
  const queue: VisualizerNode[] = [];
  if (startNodeCoords === targetNodeCoords) {
    return {
      visitedNodesInOrder,
      queue,
    };
  }
  const startNode = grid[startNodeCoords[0]][startNodeCoords[1]];
  const targetNode = grid[targetNodeCoords[0]][targetNodeCoords[1]];
  const hueristics = Array.from(Array(grid.length), (_, i) =>
    Array.from(Array(grid[0].length), (_, j) => {
      return Math.sqrt(
        (grid[i][j].row - targetNodeCoords[0]) ** 2 +
          (grid[i][j].column - targetNodeCoords[1]) ** 2
      );
    })
  );
  queue.push({
    ...startNode,
    distance: hueristics[startNodeCoords[0]][startNodeCoords[1]],
  });
  while (queue.length) {
    if (visitedNodesInOrder.length >= maxWanted) {
      return {
        visitedNodesInOrder,
        queue,
      };
    }
    queue.sort(nodesByAscDistance);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closestNode = queue.shift()!;
    if (grid[closestNode.row][closestNode.column].isVisited) {
      continue;
    }
    // If we encounter a wall, we skip it.
    if (closestNode.isWall) {
      continue;
    }
    // If the closest node is at a distance of infinity,
    // we must be trapped and should therefore stop.
    if (closestNode.distance === Number.POSITIVE_INFINITY) {
      return {
        visitedNodesInOrder,
        queue,
      };
    }
    grid[closestNode.row][closestNode.column].isVisited = true;
    grid[closestNode.row][closestNode.column].distance = closestNode.distance;
    visitedNodesInOrder.push(grid[closestNode.row][closestNode.column]);
    if (closestNode.id === targetNode.id)
      return {
        visitedNodesInOrder,
        queue,
      };
    const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
    const unwalledNeighbors = unvisitedNeighbors.filter((n) => !n.isWall);
    console.log({ v: unvisitedNeighbors.length, w: unwalledNeighbors.length });
    unwalledNeighbors.forEach((n) => {
      grid[n.row][n.column].distance = hueristics[n.row][n.column];
      grid[n.row][n.column].previousNode = closestNode.id;
      queue.push(grid[n.row][n.column]);
    });
  }
  // never reach here for valid inputs.
  return {
    visitedNodesInOrder,
    queue,
  };
}

// by backtracking from the finish node.
export function dijkstraOg(
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number
): Pick<GraphAlgorithmResults, "visitedNodesInOrder" | "queue"> {
  const visitedNodesInOrder: VisualizerNode[] = [];
  const queue: VisualizerNode[] = [];
  if (startNodeCoords === targetNodeCoords) {
    return {
      visitedNodesInOrder,
      queue,
    };
  }
  const startNode = grid[startNodeCoords[0]][startNodeCoords[1]];
  const targetNode = grid[targetNodeCoords[0]][targetNodeCoords[1]];
  queue.push({ ...startNode, distance: 0 });
  while (queue.length) {
    if (visitedNodesInOrder.length >= maxWanted) {
      return {
        visitedNodesInOrder,
        queue,
      };
    }
    queue.sort(nodesByAscDistance);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closestNode = queue.shift()!;
    if (grid[closestNode.row][closestNode.column].isVisited) {
      continue;
    }
    // If we encounter a wall, we skip it.
    if (closestNode.isWall) {
      continue;
    }
    // If the closest node is at a distance of infinity,
    // we must be trapped and should therefore stop.
    if (closestNode.distance === Number.POSITIVE_INFINITY) {
      return {
        visitedNodesInOrder,
        queue,
      };
    }
    grid[closestNode.row][closestNode.column].isVisited = true;
    grid[closestNode.row][closestNode.column].distance = closestNode.distance;
    visitedNodesInOrder.push(grid[closestNode.row][closestNode.column]);
    if (closestNode.id === targetNode.id)
      return {
        visitedNodesInOrder,
        queue,
      };
    const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
    const unwalledNeighbors = unvisitedNeighbors.filter((n) => !n.isWall);
    unwalledNeighbors.forEach((n) => {
      grid[n.row][n.column].distance = closestNode.distance + 1;
      grid[n.row][n.column].previousNode = closestNode.id;
      queue.push(grid[n.row][n.column]);
    });
  }
  // never reach here for valid inputs.
  return {
    visitedNodesInOrder,
    queue,
  };
}

const nodesByAscDistance = (nodeA: VisualizerNode, nodeB: VisualizerNode) =>
  nodeA.distance - nodeB.distance;

function getUnvisitedNeighbors(
  node: VisualizerNode,
  grid: VisualizerNode[][]
): VisualizerNode[] {
  const neighbors = [];
  const { column, row } = node;
  if (row > 0) neighbors.push(grid[row - 1][column]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][column]);
  if (column > 0) neighbors.push(grid[row][column - 1]);
  if (column < grid[0].length - 1) neighbors.push(grid[row][column + 1]);
  return neighbors.filter((neighbor) => !neighbor.isVisited);
}

// Backtracks from the finishNode to find the shortest path.
// Only works when called *after* the dijkstra method above.
function getNodesInShortestPathOrder(
  grid: VisualizerNode[][],
  finishNode: VisualizerNode
): VisualizerNode[] {
  const nodesInShortestPathOrder = [];
  let currentNode: VisualizerNode | undefined = finishNode;
  while (currentNode) {
    nodesInShortestPathOrder.unshift(currentNode);
    const backtrackedNodeIndices:
      | undefined
      | number[] = currentNode.previousNode?.split(":").slice(1).map(Number);
    if (!backtrackedNodeIndices) {
      currentNode = undefined;
    } else {
      currentNode = grid[backtrackedNodeIndices[0]][backtrackedNodeIndices[1]];
    }
  }
  return nodesInShortestPathOrder;
}
