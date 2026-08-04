<script lang="ts">
import { Clock, Trophy } from "@lucide/svelte";
import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";

export type LeaderboardMode = "hours" | "achievements";

let {
	value = $bindable("hours"),
}: {
	value?: LeaderboardMode;
} = $props();
</script>

<ToggleGroup.Root
	type="single"
	variant="outline"
	onValueChange={(v) => {
		if (v) value = v as LeaderboardMode
	}}
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
