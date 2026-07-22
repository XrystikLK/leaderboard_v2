import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Tables } from "../../db/database.types";
import type { LeaderboardResponse } from "../common/db.types";

type leaderboard = LeaderboardResponse[number];
export class LeaderboardResponseDto implements leaderboard {
	appid: string;
	steam_id: string;
	playtime_forever: string;
}

type friend = Tables<"users">;
export class UserDto implements friend {
	name: string;
	steam_id: string;
	@ApiPropertyOptional()
	avatar_hash: string | null;

	@ApiPropertyOptional()
	last_fetch_at: string | null;
	is_public: boolean;
}

export class ResolveURLResponseDto {
	@ApiProperty({ description: "The resolved Steam ID" })
	steam_id: string;
}
