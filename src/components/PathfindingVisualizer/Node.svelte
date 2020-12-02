<style>
.node {
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  outline: 0.5px solid rgba(0, 37, 32, 0.774);
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: xx-small;
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

.node-wall {
  background-image: linear-gradient(to right, #434343 0%, black 100%);
}
</style>

<script lang="ts">
export let row,
  column,
  onMouseOver,
  isFinish,
  isStart,
  isVisited,
  isOnShortestPath,
  isOnQueue,
  distance,
  isWall;
const handleMouseOver = () => {
  onMouseOver(row, column);
};
</script>

<div
  on:mouseover="{handleMouseOver}"
  class="{`node ${isWall ? 'node-wall' : ''} ${isVisited ? 'node-visited' : ''} ${isOnShortestPath ? 'node-shortest-path' : ''} ${isOnQueue ? 'node-on-queue' : ''} ${isFinish ? 'node-finish' : isStart ? 'node-start' : ''}`}"
>
  {#if isOnShortestPath || isVisited || isOnQueue}{distance.toFixed(2)}{/if}
</div>
