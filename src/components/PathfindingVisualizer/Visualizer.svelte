<script lang="ts">
  import type {
  VisualizerNode,
  GraphAlgorithm
} from '../../types';
import { buildGraph, workAlgorithm, astar, dijkstraOg } from "../../algorithms";
  import Node from '$components/PathfindingVisualizer/Node.svelte';
  let startNodeRow = 0;
  let startNodeCol = 0;
  let finishNodeRow = 19;
  let finishNodeCol = 19;
  let rows = 20;
  let columns = 20;
  let step = 0;
  let visualized = false;
  let algorithm: GraphAlgorithm = "astar";
  let grid = buildGraph(
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
      algorithm,
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
    <label for="algorithm">Algorithm :</label>
    <select id="algorithm" disabled={visualized} bind:value={algorithm}>
      <option value="astar">A *</option>
      <option value="dijkstra">Dijkstra</option>
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
