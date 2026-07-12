import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GetOwnedGamesResponse,
  OwnedGame,
} from '@oddlaceguy49/steam-web-api-types/types/IPlayerService';
import type {
  GetFriendListResponse,
  GetPlayerSummariesResponse,
  ResolveVanityURLResponse,
} from '@oddlaceguy49/steam-web-api-types/types/ISteamUser';
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import type { LeaderboardResponse } from './common/db.types';
@Injectable()
export class SteamService {
  constructor(
    private readonly configService: ConfigService,
    @InjectSupabaseClient() private readonly supabase: SupabaseClient,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getTestData() {
    return this.fetchDb(
      this.supabase.from('test').select(),
      'Database query failed',
    );
  }

  async getOwnedGames(steamId: string) {
    return this.fetchSteamApi<GetOwnedGamesResponse>(
      'IPlayerService/GetOwnedGames/v0001',
      {
        steamid: steamId,
        include_appinfo: 'true',
        include_played_free_games: 'true',
      },
    );
  }

  async getFriendList(steamId: string) {
    return this.fetchSteamApi<GetFriendListResponse>(
      'ISteamUser/GetFriendList/v0001',
      {
        steamid: steamId,
        relationship: 'friend',
      },
    );
  }

  async getPlayerSummaries(steamIds: string[]) {
    return this.fetchSteamApi<GetPlayerSummariesResponse>(
      'ISteamUser/GetPlayerSummaries/v0002',
      {
        steamids: steamIds.join(','),
      },
    );
  }

  async recordUserStats(id: string) {
    const friendsResponse = await this.getFriendList(id);
    const friends = friendsResponse.friendslist?.friends || [];

    const allIds = [id, ...friends.map((friend) => friend.steamid)];

    const chunkSize = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < allIds.length; i += chunkSize) {
      chunks.push(allIds.slice(i, i + chunkSize));
    }

    const results = await Promise.allSettled(
      chunks.map(async (array) => {
        const summaries = await this.getPlayerSummaries(array);
        return summaries.response.players.map((user) => ({
          name: user.personaname,
          steam_id: user.steamid,
          avatar_hash: user.avatarhash,
        }));
      }),
    );

    const usersToUpsert = results.reduce<
      { name: string; steam_id: string; avatar_hash: string | undefined }[]
    >((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.push(...result.value);
      }
      return acc;
    }, []);

    if (usersToUpsert.length === 0) {
      return [];
    }

    await this.fetchDb(
      this.supabase.from('users').upsert(usersToUpsert, {
        onConflict: 'steam_id',
        ignoreDuplicates: true,
      }),
      'Database upsert failed for users',
    );

    await this.recordFriendships(id);

    return usersToUpsert;
  }

  async recordFriendships(id: string) {
    const friendsResponse = await this.getFriendList(id);
    const friends = friendsResponse.friendslist?.friends || [];

    if (friends.length === 0) {
      return [];
    }

    const friendshipData = friends.map((friend) => ({
      user_id: id,
      friend_id: friend.steamid,
    }));

    await this.fetchDb(
      this.supabase.from('friendship').upsert(friendshipData, {
        onConflict: 'user_id,friend_id',
        ignoreDuplicates: true,
      }),
      'Database upsert failed for friendships',
    );

    return friendshipData;
  }

  async recordNewGames(params: {
    steam_id?: string;
    gamesData?: {
      id: number;
      name: string | undefined;
      icon_url: string | undefined;
    }[];
  }) {
    let toUpsert: {
      id: number;
      name: string | undefined;
      icon_url: string | undefined;
    }[] = [];

    if (params.gamesData) {
      toUpsert = params.gamesData;
    } else if (params.steam_id) {
      const response = await this.getOwnedGames(params.steam_id);
      const games = response.response.games || [];

      if (games.length === 0) {
        return [];
      }

      toUpsert = games.map((game) => ({
        id: game.appid,
        name: game.name,
        icon_url: game.img_icon_url,
      }));
    }

    if (toUpsert.length === 0) {
      return [];
    }

    await this.fetchDb(
      this.supabase
        .from('games')
        .upsert(toUpsert, { onConflict: 'id', ignoreDuplicates: true }),
      'Database upsert failed for games',
    );

    return toUpsert;
  }

  async recordFriendsGameStats(id: string) {
    const friendsResponse = await this.getFriendList(id);
    const friends = friendsResponse.friendslist?.friends || [];
    const allIds = [id, ...friends.map((f) => f.steamid)];

    const CONCURRENCY_LIMIT = 5;
    const results: PromiseSettledResult<OwnedGame[]>[] = [];

    for (let i = 0; i < allIds.length; i += CONCURRENCY_LIMIT) {
      const chunk = allIds.slice(i, i + CONCURRENCY_LIMIT);
      const chunkResults = await Promise.allSettled(
        chunk.map(async (steamId) => {
          const response = await this.getOwnedGames(steamId);
          return response.response.games || [];
        }),
      );
      results.push(...chunkResults);
    }

    const statsToUpsert: {
      steam_id: string;
      appid: number;
      playtime_forever: number;
    }[] = [];
    const gamesMetadata = new Map<
      number,
      { id: number; name: string; icon_url: string | undefined }
    >();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const steamId = allIds[index];
        const games = result.value;

        games.forEach((game) => {
          statsToUpsert.push({
            steam_id: steamId,
            appid: game.appid,
            playtime_forever: game.playtime_forever,
          });

          if (game.name) {
            gamesMetadata.set(game.appid, {
              id: game.appid,
              name: game.name,
              icon_url: game.img_icon_url,
            });
          }
        });
      }
    });

    if (statsToUpsert.length === 0) return [];

    if (gamesMetadata.size > 0) {
      await this.recordNewGames({
        gamesData: Array.from(gamesMetadata.values()),
      });
    }

    const chunkSize = 1000;
    for (let i = 0; i < statsToUpsert.length; i += chunkSize) {
      const chunk = statsToUpsert.slice(i, i + chunkSize);
      await this.fetchDb(
        this.supabase.from('game_stats').upsert(chunk, {
          ignoreDuplicates: true,
        }),
        'Game stats upsert failed',
      );
    }

    return statsToUpsert;
  }

  async getUserSteamId(vanityurl: string): Promise<string | undefined> {
    const response = await this.fetchSteamApi<ResolveVanityURLResponse>(
      'ISteamUser/ResolveVanityURL/v0001',
      {
        vanityurl,
      },
    );
    return response.response.steamid;
  }

  async getUserGamesFromDB(id: string) {
    const data = await this.fetchDb(
      this.supabase.from('game_stats').select().eq('steam_id', id),
      'Failed to fetch user games from database',
    );
    return data;
  }

  async getGameLeaderboard(
    steamid: string,
    appid: string,
  ): Promise<LeaderboardResponse> {
    const data = await this.fetchDb(
      this.supabase.rpc('get_leaderboard', {
        target_steam_id: steamid,
        target_appid: appid,
      }),
      'Failed to fetch leaderboard from database',
    );
    return data;
  }

  private async fetchDb<T>(
    request: PromiseLike<{ data: T | null; error: any }>,
    errorMessage: string = 'Database operation failed',
  ): Promise<T> {
    const { data, error } = await request;
    if (error) {
      throw new InternalServerErrorException(
        `${errorMessage}: ${error.message}`,
      );
    }
    return data as T;
  }

  private async fetchSteamApi<T = any>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const key = this.configService.get<string>('STEAM');
    if (!key) {
      throw new InternalServerErrorException(
        'Steam API key not set in environment',
      );
    }

    const cleanPath = path.replace(/^\/|\/$/g, '');
    const url = new URL(`https://api.steampowered.com/${cleanPath}/`);

    url.searchParams.append('key', key);
    url.searchParams.append('format', 'json');
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.append(k, v);
    }

    console.log('REQUEST URL:', url.href);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpException(
        `Failed to fetch from Steam API: ${response.statusText} - ${errorText}`,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }
}