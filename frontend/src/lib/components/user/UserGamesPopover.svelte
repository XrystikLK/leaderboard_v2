<script lang="ts">
import { page } from "$app/state";
import { buttonVariants } from "$lib/components/ui/button";
import * as Popover from "$lib/components/ui/popover";
import { client } from "$lib/api-fetch";
import {
	AlertCircle,
	Check,
	Clock,
	Gamepad2,
	Loader2,
	Search,
} from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import type { Snippet } from "svelte";

let {
	open = $bindable(false),
	steamid,
	selectedAppId = $bindable<string | null>(null),
	buttonSnippet,
}: {
	open?: boolean;
	steamid?: string;
	selectedAppId?: string | null;
	buttonSnippet?: Snippet;
} = $props();

let searchQuery = $state("");

const targetSteamId = $derived(steamid || page.params.steamid || "");

const userGamesQuery = createQuery(() => ({
	queryKey: ["user-games", targetSteamId],
	queryFn: async () => {
		const res = await client.GET("/steam/games/{steamid}", {
			params: {
				path: {
					steamid: targetSteamId,
				},
			},
		});
		return res.data ?? [];
	},
	enabled: !!targetSteamId && open,
}));

let games = $derived(userGamesQuery.data ?? []);

let filteredGames = $derived(
	games.filter((game) =>
		game.name.toLowerCase().includes(searchQuery.toLowerCase()),
	),
);

function formatPlaytime(minutesStr: string | number): string {
	const minutes =
		typeof minutesStr === "number"
			? minutesStr
			: Number.parseInt(minutesStr, 10) || 0;
	const hours = Math.floor(minutes / 60);
	return `${hours.toLocaleString()} ч.`;
}

function getHeaderImage(appid: string): string {
	return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function getIconUrl(appid: string, iconHash?: string | null): string | null {
	if (!iconHash) return null;
	if (iconHash.startsWith("http")) return iconHash;
	const cleanHash = iconHash.endsWith(".jpg") ? iconHash : `${iconHash}.jpg`;
	return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${cleanHash}`;
}

function selectGame(appid: string) {
	selectedAppId = appid;
	open = false;
}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#if buttonSnippet}
			{@render buttonSnippet()}
		{:else}
			<button class={buttonVariants({ variant: "outline" })}>
				Выбрать игру
			</button>
		{/if}
	</Popover.Trigger>
	<Popover.Content
		class="w-[540px] p-0 shadow-2xl border-border bg-card overflow-hidden rounded-xl"
		align="start"
	>
		<!-- Заголовок Поповера -->
		<div
			class="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40"
		>
			<div
				class="flex items-center gap-2 text-sm font-semibold text-foreground"
			>
				<Gamepad2 class="size-4.5 text-primary" />
				<span>Игры пользователя</span>
			</div>
			<span
				class="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border"
			>
				Всего: {games.length}
			</span>
		</div>

		<!-- Поисковая строка -->
		<div class="p-3 border-b border-border bg-card">
			<div class="relative">
				<Search
					class="absolute left-3 top-2.5 size-4 text-muted-foreground"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Поиск игры по названию..."
					class="w-full rounded-lg bg-muted/50 pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary border border-border/60 focus:border-primary/50 transition-all"
				/>
			</div>
		</div>

		<!-- Сетка игр -->
		<div class="overflow-y-auto max-h-[380px] p-3 grid grid-cols-3 gap-3">
			{#if userGamesQuery.isLoading}
				<div class="col-span-3 py-12 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
					<Loader2 class="size-6 animate-spin text-primary" />
					<span>Загрузка игр...</span>
				</div>
			{:else if userGamesQuery.isError}
				<div class="col-span-3 py-10 flex flex-col items-center justify-center text-xs text-destructive gap-2">
					<AlertCircle class="size-6" />
					<span>Не удалось загрузить игры</span>
				</div>
			{:else if filteredGames.length === 0}
				<div class="col-span-3 py-10 text-center text-xs text-muted-foreground">
					Игры по вашему запросу не найдены
				</div>
			{:else}
				{#each filteredGames as game (game.id)}
					<button
						type="button"
						onclick={() => selectGame(game.id)}
						class="group relative flex flex-col rounded-lg overflow-hidden border text-left transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 {selectedAppId === game.id ? 'bg-primary/10 border-primary ring-2 ring-primary/30' : 'bg-muted/30 border-border hover:border-primary/50 hover:bg-accent/40'}"
					>
						<!-- Постер игры -->
						<div class="relative aspect-[16/9] w-full overflow-hidden bg-muted">
							<img
								src={getHeaderImage(game.id)}
								alt={game.name}
								class="size-full object-cover group-hover:scale-105 transition-transform duration-300"
								onerror={(e) => {
									const iconUrl = getIconUrl(game.id, game.icon_url);
									if (iconUrl) {
										(e.currentTarget as HTMLImageElement).src = iconUrl;
									}
								}}
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
							
							{#if selectedAppId === game.id}
								<div class="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
									<Check class="size-3 stroke-[3]" />
								</div>
							{/if}
						</div>

						<!-- Инфо об игре -->
						<div class="p-2.5 flex flex-col gap-1 min-w-0">
							<div class="flex items-center gap-1.5 min-w-0">
								{#if getIconUrl(game.id, game.icon_url)}
									<img
										src={getIconUrl(game.id, game.icon_url)!}
										alt=""
										class="size-4 rounded shrink-0 object-cover border border-border/40"
									/>
								{/if}
								<span class="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
									{game.name}
								</span>
							</div>
							<div class="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
								<span class="flex items-center gap-1 font-mono">
									<Clock class="size-3 text-muted-foreground/70" />
									{formatPlaytime(game.playtime_forever)}
								</span>
							</div>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
