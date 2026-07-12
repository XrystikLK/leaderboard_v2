import { Controller, Get, Param } from "@nestjs/common";
import { SteamService } from './app.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { LeaderboardResponseDto } from './dto/app-responses.dto';
@Controller('steam')
export class AppController {
  constructor(private readonly steamService: SteamService) {}

  @Get('/resolveURL/:id')
  async test(@Param('id') id: string) {
    const test = await this.steamService.getUserGamesFromDB(id);
    console.log(test);
    return {
      message: `Steam user ${id} processed.`,
    };
  }

  @Get('/games/:steamid')
  async getOwnedGames(@Param('steamid') id: string) {
    return this.steamService.getOwnedGames(id);
  }

  @Get('/friends/:steamid')
  async getFriends(@Param('steamid') id: string) {
    return this.steamService.getFriendList(id);
  }

  @Get('/summaries/:steamids')
  async getSummaries(@Param('steamids') steamids: string[]) {
    return this.steamService.getPlayerSummaries(steamids);
  }

  @Get('/leaderboard/:steamid/:appid')
  async getLeaderboard(
    @Param('steamid') steamid: string,
    @Param('appid') appid: string,
  ): Promise<LeaderboardResponseDto[]> {
    return this.steamService.getGameLeaderboard(steamid, appid);
  }

  @Get('/load-stats/:steamid')
  async loadStats(@Param('steamid') steamid: string) {
    console.log(steamid);
    const userStats = await this.steamService.recordUserStats(steamid);
    const gameStats = await this.steamService.recordFriendsGameStats(steamid);
    console.log(userStats, userStats.length);
    return 'Вроде всё записал';
  }
}