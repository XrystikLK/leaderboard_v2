<script lang="ts">
import Search from "@lucide/svelte/icons/search";
import X from "@lucide/svelte/icons/x";
import { Debounced } from "runed";
import { Input } from "$lib/components/ui/input";

let { value = $bindable("") }: { value: string } = $props();
let searchValue = $state("");
let debounced = new Debounced(() => searchValue, 500);
$effect(() => {
	value = debounced.current;
});
</script>

<div class="relative w-full">
	<Search
		class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
	/>
	<Input
		type="search"
		placeholder="Поиск..."
		bind:value={searchValue}
		class="pl-9 pr-8"
	/>
	{#if value}
		<button
			type="button"
			onclick={() => (value = "")}
			class="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xs p-0.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
			aria-label="Очистить поиск"
		>
			<X class="size-4" />
		</button>
	{/if}
</div>
