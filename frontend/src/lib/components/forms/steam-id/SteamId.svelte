<script lang="ts">
import { createMutation, createQuery } from "@tanstack/svelte-query";
import { defaults, superForm } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { client } from "$lib/api-fetch";
import * as Form from "$lib/components/ui/form/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { formSchema } from "./schema";
import { goto } from "$app/navigation";
import { useQueryClient } from "@tanstack/svelte-query";

const queryClient = useQueryClient();
const form = superForm(defaults(zod4(formSchema)), {
	SPA: true,
	validators: zod4(formSchema),
	async onSubmit() {
		// TODO: Call an external API with form.data, await the result and update form

		const request = await client.GET("/steam/resolveURL/{id}", {
			params: {
				path: {
					id: $formData.url,
				},
			},
		});
		const steamId = request.data?.steam_id ?? "";
		await loadUserMutation.mutateAsync(steamId);
		goto(`${steamId}`);
	},
});

const { form: formData, enhance } = form;

const loadUserMutation = createMutation(() => ({
	mutationFn: async (steam_id: string) => {
		const request = await client.POST("/steam/load-stats/{steamid}", {
			params: {
				path: {
					steamid: steam_id,
				},
			},
		});
		return request.data;
	},
	onSuccess: (data, steam_id) => {
		queryClient.setQueryData(["user-frineds", steam_id], data);
	},
}));
</script>

<form method="POST" use:enhance>
	<Form.Field {form} name="url">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>url</Form.Label>
				<Input {...props} bind:value={$formData.url} />
			{/snippet}
		</Form.Control>
		<Form.Description>This is your public display name.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Submit</Form.Button>
</form>
<p>{loadUserMutation.status}</p>
