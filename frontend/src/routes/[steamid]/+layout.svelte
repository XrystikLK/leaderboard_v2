<script lang="ts">
import FriendsSidebar from "$lib/components/friends-sidebar/FriendsSidebar.svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.js";

let { children } = $props();
</script>

<Sidebar.Provider>
	<FriendsSidebar />
	<Sidebar.Inset>
		<Sidebar.Trigger />
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
