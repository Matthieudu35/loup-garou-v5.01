<script lang="ts">
	import { gameState } from '../stores/gameStore';
	import { onMount } from 'svelte';
	import '../styles/global.css';

	let theme = 'jour';

	// Déclaration réactive au niveau supérieur
	$: if (typeof document !== 'undefined') {
		theme = !$gameState.gameStarted ? 'jour' : ($gameState.phase === 'nuit' ? 'nuit' : 'jour');
		document.documentElement.setAttribute('data-theme', theme);
	}

	function updateTheme() {
		if (typeof document !== 'undefined') {
			theme = !$gameState.gameStarted ? 'jour' : ($gameState.phase === 'nuit' ? 'nuit' : 'jour');
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	onMount(() => {
		updateTheme();
	});
</script>

<svelte:head>
	<title>Loup-Garou</title>
</svelte:head>

<main class="app-root" data-theme={theme}>
	<slot />
</main>
