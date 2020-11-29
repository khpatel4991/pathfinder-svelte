<script context="module">
	import Visualizer from '$components/PathfindingVisualizer/Visualizer.svelte';
	export const prerender = true;
</script>


<main>
	<Visualizer />
</main>

<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
</style>
