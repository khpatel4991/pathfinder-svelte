<style>
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

<script lang="ts">
import type { VisualizerNode, GraphAlgorithm } from '../../types';
import { buildGraph, workAlgorithm } from '../../algorithms';
import Node from '$components/PathfindingVisualizer/Node.svelte';
let startNodeRow = 0;
let startNodeCol = 0;
let finishNodeRow = 19;
let finishNodeCol = 19;
let rows = 20;
let columns = 20;
let step = 0;
let visualized = false;
let wallmode = false;
let algorithm: GraphAlgorithm = 'astar';
let grid = buildGraph(rows, columns, [startNodeRow, startNodeCol], [finishNodeRow, finishNodeCol]);
let stepsToFind = -1;
let visitedNodeMap: Map<string, VisualizerNode> = new Map();
let queuedNodeMap: Map<string, VisualizerNode> = new Map();
let shortestPathNodeMap: Map<string, VisualizerNode> = new Map();
const onClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  visualized = !visualized;
  if (visualized) {
    doWork();
  } else {
    resetGrid();
  }
};
const onSliderChange = (e) => {
  const {
    target: { value },
  } = e;
  const n = Number(value);
  step = n;
};

const toggleWallMode = () => {
  wallmode = !wallmode;
};

const handleMouseOverNode = (row, column) => {
  if (wallmode) {
    grid[row][column].isWall = true;
  }
};

const handleKeydown = (event) => {
  if (event.defaultPrevented) {
    return; // Do nothing if event already handled
  }
  const { key } = event;
  switch (key) {
    case 'D':
    case 'd':
      if (!visualized) {
        toggleWallMode();
      }
      break;
    case 'R':
    case 'r':
      if (!visualized) {
        doWork();
      }
      visualized = !visualized;
      step = 0;
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (visualized && step < rows * columns) {
        step = step + 1;
      }
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (visualized && step > -1) {
        step = step - 1;
      }
      break;
    default:
      break;
  }
};

const resetWalls = () => {
  grid.forEach((row) => {
    row.forEach((node) => {
      node.isWall = false;
    });
  });
  grid = grid;
  wallmode = false;
};

const resetGrid = () => {
  const walled = grid.reduce((acc, row, i) => {
    return row.reduce((acc2, node, j) => {
      if (node.isWall) {
        return acc2.add(node.id);
      }
      return acc2;
    }, acc);
  }, new Set<string>());
  walled.delete(`n:${startNodeRow}:${startNodeCol}`);
  walled.delete(`n:${finishNodeRow}:${finishNodeCol}`);
  grid = buildGraph(
    rows,
    columns,
    [startNodeRow, startNodeCol],
    [finishNodeRow, finishNodeCol],
    walled,
  );
  wallmode = false;
};

const drawGrid = () => {
  grid.forEach((row) => {
    row.forEach((node) => {
      node.isOnQueue = queuedNodeMap.has(node.id);
      if (queuedNodeMap.has(node.id)) {
        const queuedNode = queuedNodeMap.get(node.id);
        node.distance = queuedNode.distance;
        node.previousNode = queuedNode.previousNode;
      }
      if (visitedNodeMap.has(node.id)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const visitedNode = visitedNodeMap.get(node.id)!;
        node.isVisited = true;
        node.distance = visitedNode.distance;
      } else {
        node.isVisited = false;
      }
      if (stepsToFind > -1 && shortestPathNodeMap.has(node.id)) {
        const shortestPathNode = shortestPathNodeMap.get(node.id);
        node.isOnShortestPath = true;
        node.distance = shortestPathNode.distance;
      } else {
        node.isOnShortestPath = false;
      }
    });
  });
  grid = grid;
  wallmode = false;
};

const doWork = () => {
  const walled = grid.reduce((acc, row, i) => {
    return row.reduce((acc2, node, j) => {
      if (node.isWall) {
        return acc2.add(node.id);
      }
      return acc2;
    }, acc);
  }, new Set<string>());
  const { visitedNodesInOrder, nodesInShortestPathOrder, queue, stepsToFind: s } = workAlgorithm(
    rows,
    columns,
    [startNodeRow, startNodeCol],
    [finishNodeRow, finishNodeCol],
    walled,
    algorithm,
  );
  visitedNodeMap = visitedNodesInOrder.reduce((acc, node) => {
    return acc.set(node.id, node);
  }, new Map<string, VisualizerNode>());
  shortestPathNodeMap = nodesInShortestPathOrder.reduce((acc, node) => {
    return acc.set(node.id, node);
  }, new Map<string, VisualizerNode>());
  queuedNodeMap = queue.reduce((acc, node) => {
    return acc.set(node.id, node);
  }, new Map<string, VisualizerNode>());
  stepsToFind = s;
  drawGrid();
};
</script>

<svelte:window on:keydown="{handleKeydown}" />
<div class="container">
  <div>
    <div>
      <label disabled="{visualized}" for="rows">Rows: {rows}</label>
      <input
        type="range"
        min="{1}"
        max="{100}"
        disabled="{visualized}"
        name="rows"
        id="rows"
        bind:value="{rows}"
        on:input="{resetGrid}"
      />
    </div>
    <div>
      <label disabled="{visualized}" for="columns">Columns: {columns}</label>
      <input
        type="range"
        min="{1}"
        max="{100}"
        disabled="{visualized}"
        name="columns"
        id="columns"
        bind:value="{columns}"
        on:input="{resetGrid}"
      />
    </div>
    <div>
      <label disabled="{visualized}" for="startNodeRow">Start Row: {startNodeRow}</label>
      <input
        type="range"
        min="{0}"
        max="{rows - 1}"
        disabled="{visualized}"
        name="startNodeRow"
        id="startNodeRow"
        bind:value="{startNodeRow}"
        on:input="{resetGrid}"
      />
    </div>
    <div>
      <label disabled="{visualized}" for="startNodeCol">Start Col: {startNodeCol}</label>
      <input
        type="range"
        min="{0}"
        max="{columns - 1}"
        disabled="{visualized}"
        name="startNodeCol"
        id="startNodeCol"
        bind:value="{startNodeCol}"
        on:input="{resetGrid}"
      />
    </div>
    <div>
      <label disabled="{visualized}" for="finishNodeRow">Target Row: {finishNodeRow}</label>
      <input
        type="range"
        min="{0}"
        max="{rows - 1}"
        disabled="{visualized}"
        name="finishNodeRow"
        id="finishNodeRow"
        bind:value="{finishNodeRow}"
        on:input="{resetGrid}"
      />
    </div>
    <div>
      <label disabled="{visualized}" for="finishNodeCol">Target Col: {finishNodeCol}</label>
      <input
        type="range"
        min="{0}"
        max="{columns - 1}"
        disabled="{visualized}"
        name="finishNodeCol"
        id="finishNodeCol"
        bind:value="{finishNodeCol}"
        on:input="{resetGrid}"
      />
    </div>
  </div>
  <div>
    <label for="algorithm">Algorithm :</label>
    <select id="algorithm" disabled="{visualized}" bind:value="{algorithm}">
      <option value="astar">A *</option>
      <option value="dijkstra">Dijkstra (Same as BFS for grids)</option>
      <option value="dfs">DFS (Broken)</option>
    </select>
    <button class="runbutton" on:click="{onClick}"> {visualized ? '(R)eset' : '(R)run'} </button>
    <div>
      {#if visualized}
        <div>
          <label disabled="{!visualized}" for="slider">Visited Nodes(found:
            {visualized}):
            {step}</label>
          <input
            type="range"
            min="{-1}"
            max="{visitedNodeMap.size}"
            disabled="{!visualized}"
            name="slider"
            id="slider"
            on:input="{onSliderChange}"
            bind:value="{step}"
          />
          <p>Found nodes after visiting {visitedNodeMap.size} nodes.</p>
        </div>
      {:else}
        <button class="wallmode" on:click="{toggleWallMode}">
          {wallmode ? 'Stop (D)rawing Wall' : 'Draw Wall (D)'}
        </button>
        <button class="resetwall" on:click="{resetWalls}"> Reset Walls </button>
      {/if}
    </div>
  </div>
  <div class="grid">
    {#each grid as row, i}
      <div class="row">
        {#each row as node (node.id)}
          <Node
            row="{node.row}"
            column="{node.column}"
            onMouseOver="{handleMouseOverNode}"
            isWall="{node.isWall}"
            isFinish="{node.isFinish}"
            isStart="{node.isStart}"
            isVisited="{node.isVisited}"
            isOnShortestPath="{node.isOnShortestPath}"
            isOnQueue="{node.isOnQueue}"
            distance="{node.distance}"
          />
        {/each}
      </div>
    {/each}
  </div>
</div>
