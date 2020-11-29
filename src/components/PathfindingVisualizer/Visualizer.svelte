<script lang="ts">
  import type {
  VisualizerNode,
  NodeCoordinates,
  DijstrasReturnObject,
} from '../../types';
  import Node from '$components/PathfindingVisualizer/Node.svelte';
  const START_NODE_ROW = 1;
  const START_NODE_COL = 3;
  const FINISH_NODE_ROW = 19;
  const FINISH_NODE_COL = 16;
  const ROWS = 20;
  const COLUMNS = 20;
  let visualized = false;
  let grid: VisualizerNode[][] = buildGraph(
    ROWS,
    COLUMNS,
    [START_NODE_ROW, START_NODE_COL],
    [FINISH_NODE_ROW, FINISH_NODE_COL],
  );
  let curr = -1;
  const onClick = () => {
    if(visualized) {
      curr = -1;
    } else {
      curr = 0;
    }
    visualized = !visualized;
  }
  const onSliderChange = (e) => {
    const { target: { value } } = e;
    const n = Number(value);
    curr = n;
    if(curr > -1) {
      const { visitedNodesInOrder, nodesInShortestPathOrder, queue } = dijkstra(
        ROWS,
        COLUMNS,
        [START_NODE_ROW, START_NODE_COL],
        [FINISH_NODE_ROW, FINISH_NODE_COL],
        curr,
      );
      const nodesInShortestPath = Number.isFinite(
        nodesInShortestPathOrder[0].distance,
      )
        ? nodesInShortestPathOrder
        : [];
      const visitedNodeMap = visitedNodesInOrder.reduce((acc, node) => {
        return acc.set(node.id, node);
      }, new Map<string, VisualizerNode>());
      const shortestPathNodeMap = nodesInShortestPath.reduce((acc, node) => {
        return acc.set(node.id, node);
      }, new Map<string, VisualizerNode>());
      const queuedNodeMap = queue.reduce((acc, node) => {
        return acc.set(node.id, node);
      }, new Map<string, VisualizerNode>());
      grid.forEach((row) => {
        row.forEach((node) => {
          if (visitedNodeMap.has(node.id)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const visitedNode = visitedNodeMap.get(node.id)!;
            node.isVisited = visitedNode.isVisited;
            node.distance = visitedNode.distance;
            node.previousNode = visitedNode.previousNode;
          } else {
            node.isVisited = false;
            node.distance = Number.POSITIVE_INFINITY;
            node.previousNode = undefined;
          }
          node.isOnShortestPath = shortestPathNodeMap.has(node.id);
          node.isOnQueue = queuedNodeMap.has(node.id);
        });
      });
      grid = grid;
    }
  }
  // Performs Dijkstra's algorithm; returns *all* nodes in the order
  // in which they were visited. Also makes nodes point back to their
  // previous node, effectively allowing us to compute the shortest path
  export function buildGraph(
    rows: number,
    columns: number,
    startNodeCoordinates: NodeCoordinates,
    targetNodeCoordinates: NodeCoordinates,
  ): VisualizerNode[][] {
    return Array.from(Array(rows), (_, i) =>
      Array.from<any, VisualizerNode>(Array(columns), (__, j) => ({
        id: `n:${i}:${j}`,
        row: i,
        column: j,
        isStart: i === startNodeCoordinates[0] && j === startNodeCoordinates[1],
        isFinish:
          i === targetNodeCoordinates[0] && j === targetNodeCoordinates[1],
        isWall: false,
        distance: Number.POSITIVE_INFINITY,
        isVisited: false,
        isOnShortestPath: false,
        isOnQueue: false,
      })),
    );
  }

  export function dijkstra(
    rows: number,
    columns: number,
    startNodeCoords: NodeCoordinates,
    endNodeCoords: NodeCoordinates,
    maxWanted = Number.POSITIVE_INFINITY,
  ): DijstrasReturnObject {
    const g = buildGraph(rows, columns, startNodeCoords, endNodeCoords);
    const { queue, visitedNodesInOrder } = dijkstraOg(
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
    };
  }

  // by backtracking from the finish node.
  function dijkstraOg(
    grid: VisualizerNode[][],
    startNodeCoords: NodeCoordinates,
    targetNodeCoords: NodeCoordinates,
    maxWanted: number,
  ): Pick<DijstrasReturnObject, 'visitedNodesInOrder' | 'queue'> {
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
      unvisitedNeighbors.forEach((n) => {
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

  function getUnvisitedNeighbors(node: VisualizerNode, grid: VisualizerNode[][]) {
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
    finishNode: VisualizerNode,
  ): VisualizerNode[] {
    const nodesInShortestPathOrder = [];
    let currentNode: VisualizerNode | undefined = finishNode;
    while (currentNode) {
      nodesInShortestPathOrder.unshift(currentNode);
      const backtrackedNodeIndices:
        | undefined
        | number[] = currentNode.previousNode?.split(':').slice(1).map(Number);
      if (!backtrackedNodeIndices) {
        currentNode = undefined;
      } else {
        currentNode = grid[backtrackedNodeIndices[0]][backtrackedNodeIndices[1]];
      }
    }
    return nodesInShortestPathOrder;
  }
</script>

<style>
  .container {
    background-image: linear-gradient(to right, #6a11cb 0%, #2575fc 100%);
  }

  .grid {
    box-sizing: border-box;
    display: grid;
    padding: 1rem;
    justify-content: center;
  }

  .runbutton {
    cursor: pointer;
    padding: 0.375em;
  }

  .row {
    box-sizing: border-box;
    height: 32px;
  }
</style>

<div class="container">
  <div>
    <button class="runbutton" on:click={onClick}>
      {visualized ? 'Reset' : 'Run'}
    </button>
    <input
      type="range"
      min={visualized ? 0 : -1}
      max={visualized ? ROWS * COLUMNS : 0}
      disabled={!visualized}
      name="slider"
      id="slider"
      on:input={onSliderChange}
    />
    <label for="slider">{curr}</label>
  </div>
  <div class="grid">
    {#each grid as row}
      <div class="row">
        {#each row as node (node.id)}
          <Node {...node} />
        {/each}
      </div>
    {/each}
  </div>
</div>
