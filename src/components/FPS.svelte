<script>
import { onMount } from 'svelte';
let frame;
let fps = 0;
let lastTime;
let lastUpdatedAt = Number.NEGATIVE_INFINITY;
const updateFpsIntervalInMs = 100;
onMount(() => {
  lastTime = performance.now();
  (function update() {
    frame = requestAnimationFrame(update);
    const time = performance.now();
    if (time - lastUpdatedAt > updateFpsIntervalInMs) {
      fps = Math.round(1000 / (time - lastTime));
      lastUpdatedAt = time;
    }
    lastTime = time;
  })();
  return () => {
    cancelAnimationFrame(frame);
  };
});
</script>

FPS:
{fps}
