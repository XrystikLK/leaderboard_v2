<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { goto } from "$app/navigation";
import { client } from "$lib/api-fetch";
import SteamIdForm from "$lib/components/forms/steam-id/SteamId.svelte";

let a = $state(5);

let input: HTMLInputElement | null = $state(null);
</script>

<SteamIdForm />
