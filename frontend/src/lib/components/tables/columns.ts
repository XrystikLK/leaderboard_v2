import type { ColumnDef } from "@tanstack/table-core";
import type { components } from "$lib/api-types";

export type LeaderboardResponseDto =
	components["schemas"]["LeaderboardResponseDto"];
export type LeaderboardItem = LeaderboardResponseDto["leaderboard"][number];

export const columns: ColumnDef<LeaderboardItem>[] = [
	{
		accessorKey: "name",
		header: "Имя",
	},
	{
		accessorKey: "steam_id",
		header: "Steam ID",
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
