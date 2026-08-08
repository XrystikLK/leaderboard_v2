import type VirtualList from "@humanspeak/svelte-virtual-list";

type ListRef = {
	scroll: (options: {
		index: number;
		smoothScroll?: boolean;
		shouldThrowOnBounds?: boolean;
		align?: "auto" | "top" | "bottom" | "nearest" | "center";
	}) => Promise<void>;
	scrollToOffset: (options: {
		offset: number;
		smoothScroll?: boolean;
	}) => Promise<void>;
};

export const friendsSidebar = $state<{
	ref: ListRef | undefined;
	searchValue: string;
	scrollToSteamName: (
		friends: { name: string; [key: string]: any }[],
		targetSteamName: string,
	) => { name?: string; [key: string]: any } | undefined;
}>({
	ref: undefined,
	searchValue: "",
	scrollToSteamName(friends, targetSteamName) {
		if (!targetSteamName) return undefined;

		const user = friends.find((friend) =>
			friend.name.toLocaleLowerCase().includes(targetSteamName.toLowerCase()),
		);
		if (user) {
			const index = friends.indexOf(user);
			if (index !== -1) {
				this.ref?.scroll({
					index,
					smoothScroll: true,
				});
			}
		}
		return user;
	},
});
