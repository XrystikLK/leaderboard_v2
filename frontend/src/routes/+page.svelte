<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { client } from "$lib/api-fetch";

let a = $state(5);
const query = createQuery(() => ({
	queryKey: ["test"],
	queryFn: async () => {
		const test = await client.GET("/steam/leaderboard/{steamid}/{appid}", {
			params: {
				path: { steamid: "76561198825682828", appid: "730" },
			},
		});
		return test.data;
	},
}));
</script>  

<p>hello world</p>

