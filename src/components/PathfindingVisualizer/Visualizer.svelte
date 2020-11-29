<script lang="ts">
  import type {
  VisualizerNode,
  NodeCoordinates,
  DijstrasReturnObject,
} from '../../types';
  import Node from '$components/PathfindingVisualizer/Node.svelte';
  let startNodeRow = 0;
  let startNodeCol = 0;
  let finishNodeRow = 19;
  let finishNodeCol = 19;
  let rows = 20;
  let columns = 20;
  let step = 0;
  let visualized = false;
  let algorithm = "astar";
  let grid: VisualizerNode[][] = buildGraph(
    rows,
    columns,
    [startNodeRow, startNodeCol],
    [finishNodeRow, finishNodeCol],
  );
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    visualized = !visualized;
    onSliderChange({ target: { value: 0 } })
  }
  const onSliderChange = (e) => {
    const { target: { value } } = e;
    const n = Number(value);
    step = n;
    doWork();
  }

  const redrawGrid = () => {
    grid = buildGraph(
      rows,
      columns,
      [startNodeRow, startNodeCol],
      [finishNodeRow, finishNodeCol],
    );
  }

  const doWork = () => {
    const { visitedNodesInOrder, nodesInShortestPathOrder, queue } = workAlgorithm(
      rows,
      columns,
      [startNodeRow, startNodeCol],
      [finishNodeRow, finishNodeCol],
      step,
      algorithm === "dijstra" ? dijkstraOg : astar,
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

  export function workAlgorithm(
    rows: number,
    columns: number,
    startNodeCoords: NodeCoordinates,
    endNodeCoords: NodeCoordinates,
    maxWanted = Number.POSITIVE_INFINITY,
    algorithm: (grid: VisualizerNode[][], startNodeCoords: NodeCoordinates, targetNodeCoords: NodeCoordinates, maxWanted: number) => Pick<DijstrasReturnObject, "visitedNodesInOrder" | "queue">,
  ): DijstrasReturnObject {
    const g = buildGraph(rows, columns, startNodeCoords, endNodeCoords);
    const { queue, visitedNodesInOrder } = algorithm.call(
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
    };
  }

  // by backtracking from the finish node.
  function astar(
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
    const hueristics = Array.from(Array(grid.length), (_, i) => Array.from(Array(grid[0].length), (_, j) => {
      return Math.sqrt((grid[i][j].row - targetNodeCoords[0]) ** 2 + (grid[i][j].column - targetNodeCoords[1]) ** 2)
    }));
    queue.push({ ...startNode, distance: hueristics[startNodeCoords[0]][startNodeCoords[1]] });
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
    height: 20px;
  }
</style>

<div class="container">
  <div>
    <div>
      <label disabled={visualized} for="rows">Rows: {rows}</label>
      <input
        type="range"
        min={1}
        max={100}
        disabled={visualized}
        name="rows"
        id="rows"
        bind:value={rows}
        on:input={redrawGrid}
      />
    </div>
    <div>
      <label disabled={visualized} for="columns">Columns: {columns}</label>
      <input
        type="range"
        min={1}
        max={100}
        disabled={visualized}
        name="columns"
        id="columns"
        bind:value={columns}
        on:input={redrawGrid}
      />
    </div>
    <div>
      <label disabled={visualized} for="startNodeRow">Start Row: {startNodeRow}</label>
      <input
        type="range"
        min={0}
        max={rows - 1}
        disabled={visualized}
        name="startNodeRow"
        id="startNodeRow"
        bind:value={startNodeRow}
        on:input={redrawGrid}
      />
    </div>
    <div>
      <label disabled={visualized} for="startNodeCol">Start Col: {startNodeCol}</label>
      <input
        type="range"
        min={0}
        max={columns - 1}
        disabled={visualized}
        name="startNodeCol"
        id="startNodeCol"
        bind:value={startNodeCol}
        on:input={redrawGrid}
      />
    </div>
    <div>
      <label disabled={visualized} for="finishNodeRow">Target Row: {finishNodeRow}</label>
      <input
        type="range"
        min={0}
        max={rows - 1}
        disabled={visualized}
        name="finishNodeRow"
        id="finishNodeRow"
        bind:value={finishNodeRow}
        on:input={redrawGrid}
      />
    </div>
    <div>
      <label disabled={visualized} for="finishNodeCol">Target Col: {finishNodeCol}</label>
      <input
        type="range"
        min={0}
        max={columns - 1}
        disabled={visualized}
        name="finishNodeCol"
        id="finishNodeCol"
        bind:value={finishNodeCol}
        on:input={redrawGrid}
      />
    </div>
  </div>
  <div>
    <label for="algorithm">Algorithm:</label>
    <select id="algorithm" disabled={visualized} bind:value={algorithm}>
      <option value="dijstra">Dijkstra</option>
      <option value="astar">A *</option>
    </select>
    <button class="runbutton" on:click={onClick}>
      {visualized ? 'Reset' : 'Run'}
    </button>
    {#if visualized}
      <div>
        <label disabled={!visualized} for="slider">Visited Nodes: {step}</label>
        <input
          type="range"
          min={-1}
          max={rows * columns}
          disabled={!visualized}
          name="slider"
          id="slider"
          on:input={onSliderChange}
          bind:value={step}
        />
      </div>
    {/if}
  </div>
  <div class="grid">
    {#each grid as row}
      <div class="row">
        {#each row as node (node.id)}
          <Node isWall={node.isWall} isFinish={node.isFinish} isStart={node.isStart} isVisited={node.isVisited} isOnShortestPath={node.isOnShortestPath} isOnQueue={node.isOnQueue} distance={node.distance} />
        {/each}
      </div>
    {/each}
  </div>
</div>
