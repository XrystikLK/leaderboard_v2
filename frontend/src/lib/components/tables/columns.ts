import type { ColumnDef } from "@tanstack/table-core";
import type { components } from "$lib/api-types";

export type LeaderboardResponseDto = components["schemas"]["LeaderboardResponseDto"];

export const columns: ColumnDef<LeaderboardResponseDto>[] = [
	{
		accessorKey: "steam_id",
		header: "Steam ID",
	},
	{
		accessorKey: "appid",
		header: "App ID",
	},
	{
		accessorKey: "playtime_forever",
		header: "Время в игре",
		cell: ({ row }) => {
			const minutes = Number(row.original.playtime_forever) || 0;
			const hours = (minutes / 60).toFixed(1);
			return `${hours} ч. (${minutes} мин.)`;
		},
	},
];
