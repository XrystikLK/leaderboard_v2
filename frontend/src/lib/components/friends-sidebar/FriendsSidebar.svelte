<script lang="ts">
import VirtualList from "@humanspeak/svelte-virtual-list";
import {
	Check,
	Copy,
	ExternalLink,
	Gamepad2,
	Lock,
	Users,
} from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { untrack } from "svelte";
import { page } from "$app/state";
import { client } from "$lib/api-fetch";
import Search from "$lib/components/search/SearchInput.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Skeleton } from "$lib/components/ui/skeleton";
import { friendsSidebar } from "$lib/state/friends-sidebar.svelte";

const userFriends = createQuery(() => ({
	queryKey: ["user-friends", page.params.steamid],
	queryFn: async () => {
		const request = await client.GET("/steam/friends/{steamid}", {
			params: {
				path: {
					steamid: page.params.steamid!,
				},
			},
		});
		return request.data ?? [];
	},
}));

let copiedSteamId = $state<string | null>(null);
let searchedUser = $state();

async function copyToClipboard(id: string) {
	try {
		await navigator.clipboard.writeText(id);
		copiedSteamId = id;
		setTimeout(() => {
			if (copiedSteamId === id) {
				copiedSteamId = null;
			}
		}, 2000);
	} catch (e) {
		console.error("Failed to copy steam ID", e);
	}
}

$effect(() => {
	friendsSidebar.searchValue;
	if (userFriends.isSuccess)
		untrack(
			() =>
				(searchedUser = friendsSidebar.scrollToSteamName(
					userFriends.data,
					friendsSidebar.searchValue,
				)),
		);
});
</script>

<Sidebar.Root
	class="border-r border-border bg-sidebar backdrop-blur-xl shrink-0"
>
	<Sidebar.Header class="p-4 border-b border-border">
		<div class="flex items-center justify-between">
			<h2
				class="text-base font-bold text-sidebar-foreground flex items-center gap-2"
			>
				<Users class="size-4 text-cyan-400" />
				<span>Друзья Steam</span>
				{#if !userFriends.isLoading && userFriends.data}
					<span
						class="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
					>
						{userFriends.data.length}
					</span>
				{/if}
				<Search bind:value={friendsSidebar.searchValue} />
			</h2>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="p-3">
		{#if userFriends.isLoading}
			<Sidebar.Group>
				<Sidebar.GroupContent class="flex flex-col gap-2.5">
					{#each Array(6) as _}
						<div
							class="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/40"
						>
							<Skeleton class="size-10 rounded-lg shrink-0" />
							<div class="flex-1 space-y-1.5 min-w-0">
								<Skeleton class="h-3.5 w-2/3" />
								<Skeleton class="h-2.5 w-1/2" />
							</div>
						</div>
					{/each}
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{:else if userFriends.isError}
			<div
				class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center"
			>
				<p class="text-destructive font-medium text-xs">
					Не удалось загрузить список друзей
				</p>
			</div>
		{:else if userFriends.data && userFriends.data.length > 0}
			<Sidebar.Group class="h-full flex-1">
				<Sidebar.GroupContent class="h-[calc(100vh-7rem)] w-full pr-1">
					<Sidebar.Menu class="h-full w-full">
						<VirtualList
							bind:this={friendsSidebar.ref}
							items={userFriends.data}
							containerClass="h-full w-full"
							itemsClass="flex flex-col gap-2"
							defaultEstimatedItemHeight={52}
						>
							{#snippet renderItem(friend)}
								{@const isSearchedUser = searchedUser?.steam_id === friend.steam_id}
								<Sidebar.MenuItem>
									<div
										class="group/friend relative rounded-xl {isSearchedUser ? 'bg-lime-500': 'bg-sidebar-accent/30'} hover:bg-sidebar-accent border border-sidebar-border p-3 transition-all duration-200 flex items-center justify-between gap-3 w-full"
									>
										<div class="flex items-center gap-3 min-w-0">
											<div class="relative shrink-0">
												<img
													src={friend.avatar_hash
													? `https://avatars.steamstatic.com/${friend.avatar_hash}_full.jpg`
													: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
													alt={friend.name}
													onerror={(e) => ((e.currentTarget as HTMLImageElement).src = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg")}
													class="size-10 rounded-lg object-cover ring-2 transition-transform duration-200 group-hover/friend:scale-105 {friend.game_accessibility === 'public' ? 'ring-emerald-500/60' : friend.game_accessibility === 'error' ? 'ring-amber-500/60' : 'ring-slate-700/60'}"
												>
												<span
													class="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-background flex items-center justify-center {friend.game_accessibility === 'public' ? 'bg-emerald-500 text-slate-950' : friend.game_accessibility === 'error' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-400'}"
													title={friend.game_accessibility === 'public' ? "Игры доступны" : friend.game_accessibility === 'error' ? "Ошибка получения данных" : "Приватный доступ"}
												>
													{#if friend.game_accessibility !== "public"}
														<Lock class="size-2" />
													{/if}
												</span>
											</div>

											<div class="min-w-0 flex-1">
												<h3
													class="text-xs font-bold text-foreground truncate group-hover/friend:text-cyan-300 transition-colors"
												>
													{friend.name}
												</h3>

												<div
													class="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs"
												>
													<span
														class="font-mono bg-background px-1.5 py-0.5 rounded border border-border text-[10px] truncate max-w-[110px]"
													>
														{friend.steam_id}
													</span>
													<button
														type="button"
														onclick={() => copyToClipboard(friend.steam_id)}
														class="p-0.5 rounded text-muted-foreground hover:text-cyan-300 hover:bg-muted transition-colors"
														title="Скопировать Steam ID"
													>
														{#if copiedSteamId === friend.steam_id}
															<Check class="size-3 text-emerald-400" />
														{:else}
															<Copy class="size-3" />
														{/if}
													</button>
												</div>
											</div>
										</div>

										<div class="flex flex-col items-end gap-1 shrink-0">
											{#if friend.game_accessibility === "public"}
												<p
													class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
												>
													<Gamepad2 class="size-3" />
													<span>Игры</span>
												</p>
											{:else if friend.game_accessibility === "error"}
												<span
													class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
													title="Ошибка получения данных"
												>
													<Lock class="size-3" />
													<span>Ошибка</span>
												</span>
											{:else}
												<span
													class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border"
												>
													<Lock class="size-3" />
													<span>Скрыто</span>
												</span>
											{/if}

											<a
												href="https://steamcommunity.com/profiles/{friend.steam_id}"
												target="_blank"
												rel="noopener noreferrer"
												class="text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-0.5 hover:underline transition-all"
											>
												<span>Steam</span>
												<ExternalLink class="size-2.5" />
											</a>
										</div>
									</div>
								</Sidebar.MenuItem>
							{/snippet}
						</VirtualList>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{:else}
			<p class="text-muted-foreground text-xs text-center py-6">
				Список друзей пуст
			</p>
		{/if}
	</Sidebar.Content>
</Sidebar.Root>
