import type { components } from "./api-types";

// Base DTO types from OpenAPI / Swagger schema
export type UserDto = components["schemas"]["UserDto"];
export type LeaderboardResponseDto =
	components["schemas"]["LeaderboardResponseDto"];
export type LeaderboardItem = LeaderboardResponseDto["leaderboard"][number];

export type AchievementDto = components["schemas"]["AchievementDto"];
export type AchievementLeaderboardUserDto =
	components["schemas"]["AchievementLeaderboardUserDto"];
export type AchievementsLeaderboard =
	components["schemas"]["AchievementsLeaderboard"];
