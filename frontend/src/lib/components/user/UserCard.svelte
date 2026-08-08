<script lang="ts">
import { Check, Copy, ExternalLink } from "@lucide/svelte";
import { friendsSidebar } from "$lib/state/friends-sidebar.svelte";

interface Props {
	name: string;
	steam_id?: string;
	steamid?: string;
	avatar_hash?: string | null;
	class?: string;
	showCopy?: boolean;
	showLink?: boolean;
	size?: "sm" | "md" | "lg";
}

let {
	name,
	steam_id = "",
	steamid = "",
	avatar_hash = null,
	class: className = "",
	showCopy = true,
	showLink = false,
	size = "md",
}: Props = $props();

let effectiveSteamId = $derived(steam_id || steamid);
let copied = $state(false);

const DEFAULT_AVATAR =
	"https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";

let avatarUrl = $derived(
	avatar_hash
		? `https://avatars.steamstatic.com/${avatar_hash}_full.jpg`
		: DEFAULT_AVATAR,
);

async function copySteamId() {
	try {
		await navigator.clipboard.writeText(effectiveSteamId);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	} catch (e) {
		console.error("Failed to copy steam ID", e);
	}
}
</script>

<div class="flex items-center gap-3 min-w-0 {className}">
	<img
		src={avatarUrl}
		alt={name}
		onerror={(e) => ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)}
		class="rounded-lg object-cover ring-1 ring-border shrink-0 {size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10'}"
	>
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-1.5">
			<span
				class="font-bold text-foreground truncate {size === 'sm' ? 'text-xs' : 'text-sm'}"
			>
				{name}
			</span>
			{#if showLink}
				<a
					href="https://steamcommunity.com/profiles/{effectiveSteamId}"
					target="_blank"
					rel="noopener noreferrer"
					class="text-muted-foreground hover:text-cyan-400 transition-colors"
					title="Открыть профиль Steam"
				>
					<ExternalLink class="size-3" />
				</a>
			{/if}
		</div>
		<div class="flex items-center gap-1 mt-0.5 text-muted-foreground">
			<span
				class="font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border text-[10px] truncate max-w-[140px]"
			>
				{effectiveSteamId}
			</span>
			{#if showCopy}
				<button
					type="button"
					onclick={copySteamId}
					class="p-0.5 rounded text-muted-foreground hover:text-cyan-300 hover:bg-muted transition-colors"
					title="Скопировать Steam ID"
				>
					{#if copied}
						<Check class="size-3 text-emerald-400" />
					{:else}
						<Copy class="size-3" />
					{/if}
				</button>
			{/if}
			<button
				type="button"
				onclick={() => {
					friendsSidebar.searchValue = name
			}}
			>
				перейти
			</button>
		</div>
	</div>
</div>
