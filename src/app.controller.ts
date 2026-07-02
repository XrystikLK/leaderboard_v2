import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
// biome-ignore lint/style/useImportType: <explanation>
import { ConfigService } from '@nestjs/config';
// biome-ignore lint/style/useImportType: <>
import { AppService } from './app.service';

@Controller('steam')
export class AppController {
  constructor(private configService: ConfigService) { }

  @Get('/resolveURL/:id')
  async test(@Param('id') id: string) {
    const env = this.configService.get<string>('STEAM');
    const request = await fetch('');
    return `This action returns a #${id} cat; env ${env} `;
  }

  @Get('/games/:steamid')
  async response(@Param('steamid') id: string) {
    return this.fetchSteamApi('IPlayerService/GetOwnedGames/v0001', {
      steamid: id,
      include_appinfo: 'true',
    });
  }

  @Get('/friends/:steamid')
  async getFriends(@Param('steamid') id: string) {
    return this.fetchSteamApi('ISteamUser/GetFriendList/v0001', {
      steamid: id,
      relationship: 'friend',
    });
  }

  private async fetchSteamApi<T = any>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const key = this.configService.get<string>('STEAM');
    const cleanPath = path.replace(/^\/|\/$/g, '');
    const url = new URL(`https://api.steampowered.com/${cleanPath}/`);

    url.searchParams.append('key', key || '');
    url.searchParams.append('format', 'json');
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.append(k, v);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpException(
        `Failed to fetch from Steam API: ${response.statusText}`,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }
}
