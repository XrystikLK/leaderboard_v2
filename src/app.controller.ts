import { Controller, Get, Param } from '@nestjs/common';
import { SteamService } from './app.service';

@Controller('steam')
export class AppController {
  constructor(
    private readonly steamService: SteamService,
  ) { }

  @Get('/resolveURL/:id')
  async test(@Param('id') id: string) {
    const data = await this.steamService.getTestData();
    const hello = this.steamService.getHello();
    return {
      message: `This action returns a #${id} cat; hello: ${hello}`,
      data,
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
}
