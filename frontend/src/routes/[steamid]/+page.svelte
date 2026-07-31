<script lang="ts">
import { page } from "$app/state";
import { client } from "$lib/api-fetch";
import DataTable from "$lib/components/tables/data-table.svelte";
import {
	columns,
	type LeaderboardResponseDto,
} from "$lib/components/tables/columns.ts";
import { createQuery } from "@tanstack/svelte-query";

const leaderboardQuery = createQuery(() => ({
	queryKey: ["leaderboard-hours", page.params.steamid],
	queryFn: async () => {
		const request = await client.GET("/steam/leaderboard/hours/{steamid}/{appid}", {
			params: {
				path: {
					steamid: page.params.steamid!,
					appid: "730",
				},
			},
		});
		return request.data;
	},
}));

const data: LeaderboardResponseDto[] = [
	{
		steam_id: "76561198000000000",
		appid: "730",
		playtime_forever: "1540",
	},
];
</script>

<DataTable {columns} {data} />
