<script lang="ts">
import { Progress } from "$lib/components/ui/progress";

let {
	value = 0,
	max = 1,
}: {
	value: number;
	max: number;
} = $props();

let percentage = $derived(max > 0 ? Math.round((value / max) * 100) : 0);
</script>

<div class="flex flex-col gap-1.5 min-w-[120px] max-w-[180px]">
	<div class="flex items-center justify-between text-xs gap-2">
		<span class="font-semibold text-foreground">{percentage}%</span>
		<span class="text-muted-foreground text-[11px] font-mono whitespace-nowrap">
			{value}
			/ {max}
		</span>
	</div>
	<Progress {value} {max} class="h-2 bg-muted/60" />
</div>
