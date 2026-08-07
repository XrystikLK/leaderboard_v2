/** biome-ignore-all lint/style/useImportType: <explanation> */
import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";

import { SteamService } from "./app.service";
import {
	AchievementsLeaderboard,
	LeaderboardResponseDto,
	ResolveURLResponseDto,
	UserDto,
	UserGameDto,
} from "./dto/app-responses.dto";
import { SteamApiService } from "./steam-api/steam-api.service";
@Controller("steam")
export class AppController {
	constructor(
		private readonly steamService: SteamService,
		private readonly steamApiService: SteamApiService,
	) {}

	@Get('/test/:url')
  async test(@Param('url') id: string) {

    const steam_id = await this.steamService.getAchievementsLeaderboard("76561198825682828", "3527290");
    console.log(steam_id);
    return {leaderboard: steam_id}
  }

	@ApiOkResponse({ type: [UserGameDto] })
	@Get('/games/:steamid')
  async getOwnedGames(@Param('steamid') id: string): Promise<UserGameDto[]> {
    return this.steamService.getUserGamesFromDB(id);
  }

	@Get('/friends/:steamid')
  async getFriends(@Param('steamid') id: string): Promise<UserDto[]> {
    return this.steamService.getFriendsFromDb(id);
  }

	@Get('/summaries/:steamids')
  async getSummaries(@Param('steamids') steamids: string[]) {
    return this.steamApiService.getPlayerSummaries(steamids);
  }

	@Get("/leaderboard/hours/:steamid/:appid")
	async getLeaderboard(
		@Param('steamid') steamid: string,
		@Param('appid') appid: string,
	): Promise<LeaderboardResponseDto> {
		return this.steamService.getHoursLeaderboard(steamid, appid);
	}

	@ApiOkResponse({ type: AchievementsLeaderboard })
	@Get("/leaderboard/achievements/:steamid/:appid")
	async getAchievementsLeaderboard(
		@Param("steamid") steamid: string,
		@Param("appid") appid: string,
	): Promise<AchievementsLeaderboard> {
		return this.steamService.getAchievementsLeaderboard(steamid, appid);
	}

	@Post("/record-achievement-stats/:steamid/:appid")
	async recordAchievementStats(
		@Param('steamid') steamid: string,
		@Param('appid') appid: string,
	) {
		return this.steamService.recordAchievementStats(steamid, appid);
	}

	@Post('/load-stats/:steamid')
  async loadStats(@Param('steamid') steamid: string): Promise<UserDto[]> {
    console.log(steamid);
    return this.steamService.loadUser(steamid);
  }

	@ApiOkResponse({ type: ResolveURLResponseDto })
	@Get("/resolveURL/:id")
	async resolveUrl(
		@Param("id") id: string,
	): Promise<ResolveURLResponseDto> {
		const steamId = await this.steamService.getUserSteamId(id);
		return { steam_id: steamId };
	}
}
