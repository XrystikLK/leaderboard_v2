import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Database, Tables } from "../common/db.types";

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

export type GameAccessibility = "public" | "private" | "error";

type friend = Tables<"users">;
export class UserDto implements friend {
	@ApiProperty()
	name: string;

	@ApiProperty()
	steam_id: string;

	@ApiPropertyOptional()
	avatar_hash: string | null;

	@ApiPropertyOptional()
	last_fetch_at: string | null;

	@ApiPropertyOptional({ enum: ["public", "private", "error"] })
	game_accessibility: GameAccessibility;
}

export class ResolveURLResponseDto {
	@ApiProperty({ description: "The resolved Steam ID" })
	steam_id: string;
}

export class AchievementDto implements Omit<Tables<"achievements">, "appid"> {
	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	displayed_name: string | null;

	@ApiPropertyOptional()
	description: string | null;

	@ApiPropertyOptional()
	icon_hash: string | null;

	@ApiPropertyOptional()
	icon_gray_hash: string | null;
}

export class AchievementUserStatDto
	extends UserDto
	implements Omit<Tables<"achievements_stats">, "appid" | "steam_id">
{
	@ApiProperty()
	achiev_id: string;

	@ApiProperty()
	is_achieve: boolean;

	@ApiPropertyOptional()
	unlock_time: string | null;
}

export class AchievementsLeaderboard {
	@ApiProperty({ type: [AchievementDto] })
	achievements: AchievementDto[];

	@ApiProperty({ type: [AchievementUserStatDto] })
	leaderboard: AchievementUserStatDto[];
}
