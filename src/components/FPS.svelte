<script>
  import { onDestroy,onMount } from "svelte";
  let frame;
  let fps = 0
  let lastTime;
  let lastUpdatedAt = Number.NEGATIVE_INFINITY;
  const updateFpsIntervalInMs = 500;
	onMount(() => {
    lastTime = performance.now();
    (function update() {
      frame = requestAnimationFrame(update);
      const time = performance.now();
      if((time - lastUpdatedAt) > updateFpsIntervalInMs) {
        lastUpdatedAt = time;
        fps = Math.round(1000 / (time - lastTime));
      }
      lastTime = time;
    }());  
  })
  onDestroy(() => {
    cancelAnimationFrame(frame);
  });
</script>

FPS: {fps}