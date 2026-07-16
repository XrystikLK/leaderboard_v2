<script lang="ts">
import { page } from "$app/state";
import { client } from "$lib/api-fetch";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";

const queryClient = useQueryClient();
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
		return request.data;
	},
}));
</script>
<p>hello from steamid</p>
{#each userFriends.data as friend (friend.steam_id)}
	<p>{friend.name}</p>
{/each}
