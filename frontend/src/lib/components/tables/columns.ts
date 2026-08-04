import type { ColumnDef } from "@tanstack/table-core";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import { UserCard } from "$lib/components/user";
import AchievementsGrid from "$lib/components/achievements/AchievementsGrid.svelte";
import type {
	AchievementDto,
	AchievementLeaderboardUserDto,
	LeaderboardItem,
} from "$lib/types";

export const hoursColumns: ColumnDef<LeaderboardItem>[] = [
	{
		accessorKey: "name",
		header: "Пользователь",
		cell: ({ row }) =>
			renderComponent(UserCard, {
				name: row.original.name,
				steam_id: row.original.steam_id,
				avatar_hash: row.original.avatar_hash,
				showLink: true,
			}),
	},
	{
		accessorKey: "playtime",
		header: "Время в игре",
		cell: ({ row }) => {
			const minutes = Number(row.original.playtime) || 0;
			const hours = (minutes / 60).toFixed(1);
			return `${hours} ч. (${minutes} мин.)`;
		},
	},
];

// Alias for backward compatibility
export const columns = hoursColumns;

export const getAchievementsColumns = (params: {
	achievements: Record<string, AchievementDto>;
	appid: string;
}): ColumnDef<AchievementLeaderboardUserDto>[] => [
	{
		accessorKey: "name",
		header: "Пользователь",
		cell: ({ row }) =>
			renderComponent(UserCard, {
				name: row.original.name,
				steam_id: row.original.steam_id,
				avatar_hash: row.original.avatar_hash,
				showLink: true,
			}),
	},
	{
		accessorKey: "unlocked_count",
		header: "Достижения",
		cell: ({ row }) =>
			renderComponent(AchievementsGrid, {
				data: {
					achievements: params.achievements,
					leaderboard: row.original,
				},
				appid: params.appid,
			}),
	},
];

export const achievementsColumns = getAchievementsColumns;

