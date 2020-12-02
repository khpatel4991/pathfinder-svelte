import type {
  GraphAlgorithm,
  NodeCoordinates,
  VisualizerNode,
  GraphAlgorithmResults,
  AlgorithmFn,
} from '../types';

// Performs Dijkstra's algorithm; returns *all* nodes in the order
// in which they were visited. Also makes nodes point back to their
// previous node, effectively allowing us to compute the shortest path
export function buildGraph(
  rows: number,
  columns: number,
  startNodeCoordinates: NodeCoordinates,
  targetNodeCoordinates: NodeCoordinates,
  wallNodeIds = new Set<string>(),
): VisualizerNode[][] {
  return Array.from(Array(rows), (_, i) =>
    Array.from<any, VisualizerNode>(Array(columns), (__, j) => ({
      id: `n:${i}:${j}`,
      row: i,
      column: j,
      isStart: i === startNodeCoordinates[0] && j === startNodeCoordinates[1],
      isFinish: i === targetNodeCoordinates[0] && j === targetNodeCoordinates[1],
      isWall: wallNodeIds.has(`n:${i}:${j}`),
      distance: Number.POSITIVE_INFINITY,
      isVisited: false,
      isOnShortestPath: false,
      isOnQueue: false,
    })),
  );
}

export function workAlgorithm(
  rows: number,
  columns: number,
  startNodeCoords: NodeCoordinates,
  endNodeCoords: NodeCoordinates,
  wallCoords = new Set<string>(),
  algorithm: GraphAlgorithm,
  maxWanted = Number.POSITIVE_INFINITY,
): GraphAlgorithmResults {
  const g = buildGraph(rows, columns, startNodeCoords, endNodeCoords, wallCoords);
  const map: Record<GraphAlgorithm, AlgorithmFn> = {
    astar,
    dijkstra,
    dfs,
  };
  const { queue, visitedNodesInOrder, stepsToFind } = map[algorithm].call(
    this,
    g,
    startNodeCoords,
    endNodeCoords,
    maxWanted,
  );
  const nodesInShortestPathOrder = getNodesInShortestPathOrder(
    g,
    g[endNodeCoords[0]][endNodeCoords[1]],
  );
  return {
    nodesInShortestPathOrder,
    queue,
    visitedNodesInOrder,
    stepsToFind,
  };
}

// by backtracking from the finish node.
export function astar(
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number,
): Omit<GraphAlgorithmResults, 'nodesInShortestPathOrder'> {
  const visitedNodesInOrder: VisualizerNode[] = [];
  const queue: VisualizerNode[] = [];
  let i = 0;
  if (startNodeCoords[0] === targetNodeCoords[0] && startNodeCoords[1] === targetNodeCoords[1]) {
    return {
      visitedNodesInOrder,
      queue,
      stepsToFind: 0,
    };
  }
  const startNode = grid[startNodeCoords[0]][startNodeCoords[1]];
  const targetNode = grid[targetNodeCoords[0]][targetNodeCoords[1]];
  const hueristics = Array.from(Array(grid.length), (_, i) =>
    Array.from(Array(grid[0].length), (_, j) => {
      return Math.sqrt(
        (grid[i][j].row - targetNodeCoords[0]) ** 2 +
          (grid[i][j].column - targetNodeCoords[1]) ** 2,
      );
    }),
  );
  queue.push({
    ...startNode,
    distance: hueristics[startNodeCoords[0]][startNodeCoords[1]],
  });
  while (queue.length && maxWanted > visitedNodesInOrder.length) {
    i += 1;
    queue.sort(nodesByAscDistance);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closestNode = queue.shift()!;
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
        stepsToFind: -1,
      };
    }
    if (closestNode.id === targetNode.id) {
      return {
        visitedNodesInOrder,
        queue,
        stepsToFind: i,
      };
    }
    grid[closestNode.row][closestNode.column].isVisited = true;
    grid[closestNode.row][closestNode.column].distance = closestNode.distance;
    visitedNodesInOrder.push(grid[closestNode.row][closestNode.column]);
    const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
    const unwalledNeighbors = unvisitedNeighbors.filter((n) => !n.isWall);
    unwalledNeighbors.forEach((n) => {
      grid[n.row][n.column].distance = hueristics[n.row][n.column];
      grid[n.row][n.column].previousNode = closestNode.id;
      queue.push(grid[n.row][n.column]);
    });
  }
  return {
    visitedNodesInOrder,
    queue,
    stepsToFind: -1,
  };
}

// by backtracking from the finish node.
export function dijkstra(
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number,
): Omit<GraphAlgorithmResults, 'nodesInShortestPathOrder'> {
  const visitedNodesInOrder: VisualizerNode[] = [];
  const queue: VisualizerNode[] = [];
  if (startNodeCoords[0] === targetNodeCoords[0] && startNodeCoords[1] === targetNodeCoords[1]) {
    return {
      visitedNodesInOrder,
      queue,
      stepsToFind: 0,
    };
  }
  let i = 0;
  const startNode = grid[startNodeCoords[0]][startNodeCoords[1]];
  const targetNode = grid[targetNodeCoords[0]][targetNodeCoords[1]];
  queue.push({ ...startNode, distance: 0 });
  while (queue.length && maxWanted > visitedNodesInOrder.length) {
    i += 1;
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
        stepsToFind: -1,
      };
    }
    if (closestNode.id === targetNode.id) {
      return {
        visitedNodesInOrder,
        queue,
        stepsToFind: i,
      };
    }
    grid[closestNode.row][closestNode.column].isVisited = true;
    grid[closestNode.row][closestNode.column].distance = closestNode.distance;
    visitedNodesInOrder.push(grid[closestNode.row][closestNode.column]);
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
    stepsToFind: -1,
  };
}

export function dfs(
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number,
): Omit<GraphAlgorithmResults, 'nodesInShortestPathOrder'> {
  const visitedNodesInOrder: VisualizerNode[] = [];
  const queue: VisualizerNode[] = [];
  if (startNodeCoords[0] === targetNodeCoords[0] && startNodeCoords[1] === targetNodeCoords[1]) {
    return {
      visitedNodesInOrder,
      queue,
      stepsToFind: 0,
    };
  }
  let i = 0;
  const startNode = grid[startNodeCoords[0]][startNodeCoords[1]];
  const targetNode = grid[targetNodeCoords[0]][targetNodeCoords[1]];
  queue.push({ ...startNode, distance: 0 });
  while (queue.length && maxWanted > visitedNodesInOrder.length) {
    i += 1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closestNode = queue.pop()!;
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
        stepsToFind: -1,
      };
    }
    if (closestNode.id === targetNode.id) {
      return {
        visitedNodesInOrder,
        queue,
        stepsToFind: i,
      };
    }
    grid[closestNode.row][closestNode.column].isVisited = true;
    grid[closestNode.row][closestNode.column].distance = closestNode.distance;
    visitedNodesInOrder.push(grid[closestNode.row][closestNode.column]);
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
    stepsToFind: -1,
  };
}

const dfsOg = (
  grid: VisualizerNode[][],
  startNodeCoords: NodeCoordinates,
  targetNodeCoords: NodeCoordinates,
  maxWanted: number,
) => {
  return dfsh(
    grid,
    grid[startNodeCoords[0]][startNodeCoords[1]].id,
    grid[targetNodeCoords[0]][targetNodeCoords[1]].id,
  );
};

const dfsh = (grid: VisualizerNode[][], curr: string, target: string): boolean => {
  const [_, rs, cs] = curr.split(':');
  const r = Number(rs);
  const c = Number(cs);
  if (grid[r][c].isVisited) {
    return false;
  }
  grid[r][c].isVisited = true;
  if (curr === target) {
    return true;
  }
  const neighbors = getNeighbors(grid[r][c], grid);
  return neighbors.reduce((acc, n) => {
    return acc || dfsh(grid, n.id, target);
  }, false);
};

const nodesByAscDistance = (nodeA: VisualizerNode, nodeB: VisualizerNode) =>
  nodeA.distance - nodeB.distance;

function getNeighbors(node: VisualizerNode, grid: VisualizerNode[][]): VisualizerNode[] {
  const neighbors = [];
  const { column, row } = node;
  if (row > 0) neighbors.push(grid[row - 1][column]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][column]);
  if (column > 0) neighbors.push(grid[row][column - 1]);
  if (column < grid[0].length - 1) neighbors.push(grid[row][column + 1]);
  return neighbors;
}

export function getAllNeighbours(
  node: Pick<VisualizerNode, 'row' | 'column'>,
  grid: VisualizerNode[][],
): VisualizerNode[] {
  const { row, column } = node;
  const allNeighbourIndices: NodeCoordinates[] = [
    [row - 1, column - 1], // tl,
    [row - 1, column], // t
    [row - 1, column + 1], // tr
    [row, column + 1], // r
    [row + 1, column + 1], // br,
    [row + 1, column], // b
    [row + 1, column - 1], // bl
    [row, column - 1], //  l
  ];
  const filtered = allNeighbourIndices.filter(([r, c]) => {
    const validRowIndex = r >= 0 && r < grid.length - 1;
    const validColumnIndex = c >= 0 && c < grid.length - 1;
    return validRowIndex && validColumnIndex;
  });
  return filtered.map((coords) => grid[coords[0]][coords[1]]);
}

function getUnvisitedNeighbors(node: VisualizerNode, grid: VisualizerNode[][]): VisualizerNode[] {
  return getNeighbors(node, grid).filter((neighbor) => !neighbor.isVisited);
}

// Backtracks from the finishNode to find the shortest path.
// Only works when called *after* the dijkstra method above.
function getNodesInShortestPathOrder(
  grid: VisualizerNode[][],
  finishNode: VisualizerNode,
): VisualizerNode[] {
  const nodesInShortestPathOrder = [];
  let currentNode: VisualizerNode | undefined = finishNode;
  while (currentNode) {
    nodesInShortestPathOrder.unshift(currentNode);
    const backtrackedNodeIndices: undefined | number[] = currentNode.previousNode
      ?.split(':')
      .slice(1)
      .map(Number);
    if (!backtrackedNodeIndices) {
      currentNode = undefined;
    } else {
      currentNode = grid[backtrackedNodeIndices[0]][backtrackedNodeIndices[1]];
    }
  }
  return nodesInShortestPathOrder;
}
