<style>
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
}

:global(body) {
  overflow: hidden;
  background-image: linear-gradient(to right, #6a11cb 0%, #2575fc 100%);
}

main {
  text-align: center;
  padding: 1em;
  margin: 0 auto;
}
header {
  display: flex;
  flex-direction: row-reverse;
  color: black;
  font-size: large;
}
</style>

<script context="module">
import Visualizer from '$components/PathfindingVisualizer/Visualizer.svelte';
import FPS from '$components/FPS.svelte';
export const prerender = true;
</script>

<header>
  <FPS />
</header>

<main>
  <Visualizer />
</main>
