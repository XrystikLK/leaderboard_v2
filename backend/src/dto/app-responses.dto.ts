import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Tables } from "../../db/database.types";
import type { Database } from "../common/db.types";

export type Leaderboard = {
	leaderboard: Database["public"]["Functions"]["get_hours_leaderboard"]["Returns"];
};

export class LeaderboardResponseDto implements Leaderboard {
	game_info: {
		name: string;
		appid: string;
		icon_url: string;
	};
	leaderboard: {
		name: string;
		steam_id: string;
		avatar_hash: string;
		playtime: number;
	}[];
}

type friend = Tables<"users">;
export class UserDto implements friend {
	name: string;
	steam_id: string;
	@ApiPropertyOptional()
	avatar_hash: string | null;

	@ApiPropertyOptional()
	last_fetch_at: string | null;
	is_games_available: boolean;
}

export class ResolveURLResponseDto {
	@ApiProperty({ description: "The resolved Steam ID" })
	steam_id: string;
}
