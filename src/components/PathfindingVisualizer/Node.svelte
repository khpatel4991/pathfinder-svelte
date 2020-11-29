<script lang="ts">
  export let isFinish, isStart, isVisited, isOnShortestPath, isOnQueue, distance;
</script>

<style>
  .node {
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    outline: 1px solid rgba(0, 37, 32, 0.774);
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-finish {
    background-image: linear-gradient(-20deg, #1ea391 0%, #054e0b 100%);
  }

  .node-start {
    background-image: linear-gradient(-45deg, #ffc796 0%, #ff6b95 100%);
  }

  .node-visited {
    background-image: linear-gradient(
      -45deg,
      rgba(0, 190, 218, 0.25) 0%,
      rgba(0, 190, 218, 0.75) 100%
    );
  }

  .node-shortest-path {
    background-image: linear-gradient(
      -45deg,
      rgba(255, 254, 106, 0.25) 0%,
      rgba(255, 254, 106, 0.75) 100%
    );
  }

  .node-on-queue {
    background-image: linear-gradient(-45deg, #ffc79677 0%, #ff6b9577 100%);
  }

  .node-start.node-visited {
    background-image: linear-gradient(
      -45deg,
      rgba(0, 190, 218, 0.75) 0%,
      rgba(0, 190, 218, 0) 100%
    );
  }
  .node-finish.node-visited {
    background-image: linear-gradient(
      -45deg,
      rgba(11, 63, 9, 0.75) 0%,
      rgba(11, 63, 9, 0) 100%
    );
  }
</style>

<div class={`node ${isFinish ? 'node-finish' : isStart ? 'node-start' : ''} ${isVisited ? 'node-visited' : ''} ${isOnShortestPath ? 'node-shortest-path' : ''} ${isOnQueue ? 'node-on-queue' : ''}`}>
  {#if isOnShortestPath || isVisited}
    {distance}
  {/if}
</div>
