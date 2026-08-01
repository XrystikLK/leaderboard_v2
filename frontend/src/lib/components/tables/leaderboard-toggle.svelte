<script lang="ts">
import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
import { Clock, Trophy } from "@lucide/svelte";

export type LeaderboardMode = "hours" | "achievements";

let {
	value = $bindable("hours"),
	class: className = "",
}: {
	value?: LeaderboardMode;
	class?: string;
} = $props();
</script>

<ToggleGroup.Root
	type="single"
	bind:value={value as never}
	variant="outline"
	class={className}
>
	<ToggleGroup.Item value="hours" aria-label="Статистика по часам">
		<Clock data-icon="inline-start" />
		<span>По часам</span>
	</ToggleGroup.Item>
	<ToggleGroup.Item value="achievements" aria-label="Статистика по достижениям">
		<Trophy data-icon="inline-start" />
		<span>По достижениям</span>
	</ToggleGroup.Item>
</ToggleGroup.Root>
