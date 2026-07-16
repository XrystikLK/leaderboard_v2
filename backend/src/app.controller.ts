import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
// biome-ignore lint/style/useImportType: <explanation>
import { SteamService } from "./app.service";
import type { LeaderboardResponseDto, ResolveURLResponseDto, UserDto } from "./dto/app-responses.dto";
@Controller("steam")
export class AppController {
	constructor(private readonly steamService: SteamService) {}

	@Get('/resolveURL/:url')
  async test(@Param('url') id: string): Promise<ResolveURLResponseDto> {

    const steam_id = await this.steamService.getUserSteamId(id);
    console.log(steam_id);
    // return {
    //   message: `Steam user ${test} processed.`,
    // }; 
    return { steam_id }
  }

	@Get('/games/:steamid')
  async getOwnedGames(@Param('steamid') id: string) {
    return this.steamService.getOwnedGames(id);
  }

	@Get('/friends/:steamid')
  async getFriends(@Param('steamid') id: string): Promise<UserDto[]> {
    return this.steamService.getFriendsFromDb(id);
  }

	@Get('/summaries/:steamids')
  async getSummaries(@Param('steamids') steamids: string[]) {
    return this.steamService.getPlayerSummaries(steamids);
  }

	@Get("/leaderboard/:steamid/:appid")
	async getLeaderboard(
		@Param('steamid') steamid: string,
		@Param('appid') appid: string,  
	): Promise<LeaderboardResponseDto[]> {
		return this.steamService.getGameLeaderboard(steamid, appid);
	}

	@Post('/load-stats/:steamid')
  async loadStats(@Param('steamid') steamid: string): Promise<UserDto[]> {
    console.log(steamid);
    const userStats = await this.steamService.recordUserStats(steamid);
    const gameStats = await this.steamService.recordFriendsGameStats(steamid);
    console.log(userStats, userStats.length);
    return userStats;
  }
}
