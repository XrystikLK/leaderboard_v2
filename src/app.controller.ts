import { Controller, Get, Param } from '@nestjs/common';
import { SteamService } from './app.service';

@Controller('steam')
export class AppController {
  constructor(private readonly steamService: SteamService) {}

  @Get('/resolveURL/:id')
  async test(@Param('id') id: string) {
    const test = await this.steamService.recordUserStats(id);
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
}
