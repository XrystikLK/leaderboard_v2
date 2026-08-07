<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { page } from "$app/state";
import { client } from "$lib/api-fetch";
import {
	achievementsColumns,
	hoursColumns,
	type LeaderboardResponseDto,
} from "$lib/components/tables/columns.ts";
import DataTable from "$lib/components/tables/data-table.svelte";
import LeaderboardToggle, {
	type LeaderboardMode,
} from "$lib/components/tables/leaderboard-toggle.svelte";
import GamesSelector from "$lib/components/user/UserGamesPopover.svelte";
import { friendsSidebar } from "$lib/state/friends-sidebar.svelte";

let selectedGames = $state("");
let input = $state<HTMLInputElement>();
let tableType = $state<LeaderboardMode>("hours");
let isGamesSelectorOpen = $state(false);

const leaderboardQuery = createQuery(() => ({
	queryKey: ["leaderboard-hours", page.params.steamid, selectedGames],
	queryFn: async () => {
		const request = await client.GET(
			"/steam/leaderboard/hours/{steamid}/{appid}",
			{
				params: {
					path: {
						steamid: page.params.steamid!,
						appid: selectedGames,
					},
				},
			},
		);
		return request.data;
	},
	enabled: !!selectedGames && tableType === "hours",
}));

const achievementsLeaderboardQuery = createQuery(() => ({
	queryKey: ["leaderboard-achievements", page.params.steamid, selectedGames],
	queryFn: async () => {
		const request = await client.GET(
			"/steam/leaderboard/achievements/{steamid}/{appid}",
			{
				params: {
					path: {
						steamid: page.params.steamid!,
						appid: selectedGames,
					},
				},
			},
		);
		return request.data;
	},
	enabled: !!selectedGames && tableType === "achievements",
}));
</script>

<input bind:this={input} class="bg-lime-500" placeholder="appid...">
<button
	type="button"
	onclick={() => selectedGames = input?.value || ""}
	class="text-lime-500"
>
	Send
</button>
<div class="flex items-center gap-4 my-4">
	<LeaderboardToggle bind:value={tableType} />
</div>
{#if tableType === "hours"}
	{#if leaderboardQuery.isSuccess && leaderboardQuery.data}
		<DataTable
			columns={hoursColumns}
			data={leaderboardQuery.data.leaderboard}
		/>
	{/if}
{:else if tableType === "achievements"}
	{#if achievementsLeaderboardQuery.isSuccess && achievementsLeaderboardQuery.data}
		<DataTable
			columns={achievementsColumns({
				achievements: achievementsLeaderboardQuery.data.achievements,
				appid: selectedGames,
			})}
			data={achievementsLeaderboardQuery.data.leaderboard}
		/>
	{/if}
{/if}

<GamesSelector bind:open={isGamesSelectorOpen} bind:selectedAppId={selectedGames}>
	{#snippet buttonSnippet()}
		<div class="flex w-50 justify-end">
			<p class="text-amber-500 w-20 mx-auto">Выбрать игру</p>
		</div>
	{/snippet}
</GamesSelector> 

