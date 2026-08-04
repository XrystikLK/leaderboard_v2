<script lang="ts">
import { CheckCircle2, Lock, Trophy } from "@lucide/svelte";
import * as HoverCard from "$lib/components/ui/hover-card";
import type { AchievementDto, AchievementLeaderboardUserDto } from "$lib/types";

let {
	data,
	appid,
}: {
	data: {
		achievements: Record<string, AchievementDto>;
		leaderboard: AchievementLeaderboardUserDto;
	};
	appid: string;
} = $props();

const achievementsList = $derived(
	Object.entries(data?.achievements ?? {}).map(([key, item]) => {
		const userAch = data?.leaderboard?.user_achievements;
		const isUnlocked = userAch ? Object.hasOwn(userAch, key) : false;
		const hash = isUnlocked
			? item.icon_hash || item.icon_gray_hash
			: item.icon_gray_hash || item.icon_hash;
		return {
			key,
			name: item.displayed_name || key,
			description: item.description || "Описание отсутствует",
			isUnlocked,
			iconUrl: getIconUrl(hash),
		};
	}),
);

const totalCount = $derived(achievementsList.length);
const unlockedCount = $derived(
	data?.leaderboard?.unlocked_count ??
		achievementsList.filter((a) => a.isUnlocked).length,
);

function getIconUrl(hash: string | null | undefined): string | null {
	if (!hash) return null;
	if (hash.startsWith("http://") || hash.startsWith("https://")) {
		return hash;
	}
	return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
}
</script>

<HoverCard.Root openDelay={100}>
	<HoverCard.Trigger
		class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent text-xs font-semibold transition-all cursor-pointer select-none"
	>
		<Trophy class="size-4 text-amber-400" />
		<span>Достижения: {unlockedCount} / {totalCount}</span>
	</HoverCard.Trigger>

	<HoverCard.Content class="w-[340px] p-3 space-y-2.5 z-40">
		<div class="flex items-center justify-between pb-2 border-b border-border">
			<span class="text-xs font-bold text-foreground flex items-center gap-1.5">
				<Trophy class="size-3.5 text-amber-400" />
				<span>Все достижения</span>
			</span>
			<span class="text-[11px] font-medium text-muted-foreground">
				{unlockedCount}
				из
				{totalCount}
				({totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%)
			</span>
		</div>

		{#if achievementsList.length === 0}
			<p class="text-xs text-muted-foreground text-center py-4">
				Достижения не найдены
			</p>
		{:else}
			<div class="flex flex-wrap gap-1.5 max-h-[260px] overflow-y-auto pr-1">
				{#each achievementsList as achievement (achievement.key)}
					<HoverCard.Root openDelay={100}>
						<HoverCard.Trigger
							class="relative flex items-center justify-center size-9 rounded-md border transition-all cursor-pointer {achievement.isUnlocked ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-400' : 'border-border/60 bg-muted/40 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}"
						>
							{#if achievement.iconUrl}
								<img
									src={achievement.iconUrl}
									alt={achievement.name}
									class="size-full rounded-md object-cover"
									onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
								>
							{:else}
								<Trophy
									class="size-4 {achievement.isUnlocked ? 'text-emerald-400' : 'text-muted-foreground'}"
								/>
							{/if}
						</HoverCard.Trigger>

						<HoverCard.Content side="top" class="w-72 p-3 space-y-2 z-50">
							<div class="flex items-start gap-2.5">
								{#if achievement.iconUrl}
									<img
										src={achievement.iconUrl}
										alt={achievement.name}
										class="size-9 rounded-md object-cover border border-border shrink-0"
									>
								{:else}
									<div
										class="flex items-center justify-center size-9 rounded-md bg-muted border border-border shrink-0"
									>
										<Trophy class="size-4 text-muted-foreground" />
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<h4 class="text-xs font-bold text-foreground truncate">
										{achievement.name}
									</h4>
									<div class="flex items-center gap-1 mt-0.5">
										{#if achievement.isUnlocked}
											<span
												class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400"
											>
												<CheckCircle2 class="size-3" />
												<span>Разблокировано</span>
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
											>
												<Lock class="size-3" />
												<span>Заблокировано</span>
											</span>
										{/if}
									</div>
								</div>
							</div>
							<p
								class="text-[11px] text-muted-foreground leading-relaxed pt-1.5 border-t border-border/60"
							>
								{achievement.description}
							</p>
						</HoverCard.Content>
					</HoverCard.Root>
				{/each}
			</div>
		{/if}
	</HoverCard.Content>
</HoverCard.Root>
