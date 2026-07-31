/** biome-ignore-all lint/style/useImportType: <explanation> */
import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
	GetOwnedGamesResponse,
	OwnedGame,
} from "@oddlaceguy49/steam-web-api-types/types/IPlayerService";
import type {
	GetFriendListResponse,
	GetPlayerSummariesResponse,
	ResolveVanityURLResponse,
} from "@oddlaceguy49/steam-web-api-types/types/ISteamUser";
import type {
	GetPlayerAchievementsResponse,
	GetSchemaForGameResponse,
} from "@oddlaceguy49/steam-web-api-types/types/ISteamUserStats";
import { SupabaseClient } from "@supabase/supabase-js";
import { InjectSupabaseClient } from "nestjs-supabase-js";
import type {
	UserDto,
	LeaderboardResponseDto,
	Leaderboard,
} from "./dto/app-responses.dto";
@Injectable()
export class SteamService {
	constructor(
    private readonly configService: ConfigService,
    @InjectSupabaseClient() private readonly supabase: SupabaseClient,
  ) {}

	getHello(): string {
		return "Hello World!";
	}

	async getTestData() {
		return this.fetchDb(
			this.supabase.from("test").select(),
			"Database query failed",
		);
	}

	async getOwnedGames(steamId: string) {
		return this.fetchSteamApi<GetOwnedGamesResponse>(
			"IPlayerService/GetOwnedGames/v0001",
			{
				steamid: steamId,
				include_appinfo: "true",
				include_played_free_games: "true",
			},
		);
	}

	async getSchemaForGame(appId: string): Promise<GetSchemaForGameResponse> {
		return this.fetchSteamApi<GetSchemaForGameResponse>(
			"ISteamUserStats/GetSchemaForGame/v2",
			{
				appid: appId,
				l: "russian",
			},
		);
	}

	async getPlayerAchievements(
		appId: string,
		steamId: string,
	): Promise<GetPlayerAchievementsResponse> {
		return this.fetchSteamApi<GetPlayerAchievementsResponse>(
			"ISteamUserStats/GetPlayerAchievements/v0001",
			{
				appid: appId,
				steamid: steamId,
				l: "russian",
			},
		);
	}

	async recordAchievementStats(steamId: string, appId: string) {
		await this.recordGameAchievements(appId);

		const friendIds = await this.getFriendsWithGame(steamId, appId);

		console.log("Friends with game:", friendIds);

		if (friendIds.length === 0) {
			return [];
		}

		const CONCURRENCY_LIMIT = 5;
		const allStatsToUpsert: {
			steam_id: string;
			achiev_id: string;
			is_achieve: boolean;
			unlock_time: string | null;
		}[] = [];

		for (let i = 0; i < friendIds.length; i += CONCURRENCY_LIMIT) {
			const chunk = friendIds.slice(i, i + CONCURRENCY_LIMIT);
			const chunkResults = await Promise.allSettled(
				chunk.map(async (friendId) => {
					const res = await this.getPlayerAchievements(appId, friendId);
					return {
						steamId: friendId,
						achievements: res.playerstats?.achievements || [],
					};
				}),
			);

			chunkResults.forEach((result) => {
				if (
					result.status === "fulfilled" &&
					result.value.achievements.length > 0
				) {
					const { steamId, achievements } = result.value;
					achievements.forEach((ach) => {
						allStatsToUpsert.push({
							steam_id: steamId,
							achiev_id: ach.apiname,
							is_achieve: ach.achieved === 1,
							unlock_time:
								ach.unlocktime > 0
									? new Date(ach.unlocktime * 1000).toISOString()
									: null,
						});
					});
				}
			});
		}

		if (allStatsToUpsert.length === 0) {
			return [];
		}

		const chunkSize = 1000;
		for (let i = 0; i < allStatsToUpsert.length; i += chunkSize) {
			const chunk = allStatsToUpsert.slice(i, i + chunkSize);
			await this.fetchDb(
				this.supabase.from("achievements_stats").upsert(chunk, {
					onConflict: "steam_id,achiev_id",
				}),
				"Database upsert failed for achievements_stats",
			);
		}

		return allStatsToUpsert;
	}

	async recordGameAchievements(appId: string) {
		const schema = await this.getSchemaForGame(appId);
		const achievements = schema?.game?.availableGameStats?.achievements || [];

		if (achievements.length === 0) {
			return [];
		}

		const achievementsToUpsert = achievements.map((ach) => ({
			appid: String(appId),
			name: ach.name,
			displayed_name: ach.displayName ?? null,
			description: ach.description ?? null,
			icon_hash: this.extractIconHash(ach.icon),
			icon_gray_hash: this.extractIconHash(ach.icongray),
		}));

		await this.fetchDb(
			this.supabase.from("achievements").upsert(achievementsToUpsert, {
				onConflict: "appid,name",
				ignoreDuplicates: true,
			}),
			"Database upsert failed for achievements",
		);

		return achievementsToUpsert;
	}

	private extractIconHash(url?: string): string | null {
		if (!url) return null;
		const filename = url.split("/").pop();
		return filename ? filename.replace(/\.[^/.]+$/, "") : null;
	}

	async getFriendList(steamId: string) {
		return this.fetchSteamApi<GetFriendListResponse>(
			"ISteamUser/GetFriendList/v0001",
			{
				steamid: steamId,
				relationship: "friend",
			},
		);
	}

	async getFriendsFromDb(steamId: string): Promise<UserDto[]> {
		const friendships = await this.fetchDb(
			this.supabase
				.from("friendship")
				.select("friend_id")
				.eq("user_id", steamId),
			"Failed to fetch friendships from database",
		);

		const friendIds = friendships.map((f) => f.friend_id);

		if (friendIds.length === 0) {
			return [];
		}

		return this.fetchDb(
			this.supabase.from("users").select("*").in("steam_id", friendIds),
			"Failed to fetch friends details from database",
		);
	}

	async getFriendsWithGame(steamId: string, appId: string): Promise<string[]> {
		const friendships = await this.fetchDb(
			this.supabase
				.from("friendship")
				.select("friend_id")
				.eq("user_id", steamId),
			"Failed to fetch friendships from database",
		);

		const friendIds = friendships.map((f) => f.friend_id);

		if (friendIds.length === 0) {
			return [];
		}

		const friendsWithGame = await this.fetchDb(
			this.supabase
				.from("game_stats")
				.select("steam_id")
				.eq("appid", appId)
				.in("steam_id", friendIds),
			"Failed to fetch game stats for friends",
		);

		const matchedSteamIds: string[] = friendsWithGame.map((g) => g.steam_id);

		return matchedSteamIds;
	}

	async getPlayerSummaries(steamIds: string[]) {
		return this.fetchSteamApi<GetPlayerSummariesResponse>(
			"ISteamUser/GetPlayerSummaries/v0002",
			{
				steamids: steamIds.join(","),
			},
		);
	}

	async loadUserStats(
		id: string,
	): Promise<Omit<UserDto, "is_games_available">[]> {
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
				return summaries.response.players.map((user) => {
					const obj = {
						name: user.personaname,
						steam_id: user.steamid,
						avatar_hash: user.avatarhash ?? null,
						last_fetch_at:
							user.steamid === id ? new Date().toISOString() : null,
					};
					return obj;
				});
			}),
		);

		const usersToUpsert = results.reduce<Omit<UserDto, "is_games_available">[]>(
			(acc, result) => {
				if (result.status === "fulfilled") {
					acc.push(...result.value);
				}
				return acc;
			},
			[],
		);

		return usersToUpsert;
	}

	async loadUser(steamId: string): Promise<UserDto[]> {
		const user = await this.fetchDb<UserDto>(
			this.supabase
				.from("users")
				.select("*")
				.eq("steam_id", steamId)
				.maybeSingle(),
			"Failed to fetch user for cache check",
		);
		const threeHoursInMs = 3 * 60 * 60 * 1000;
		if (user && user.last_fetch_at) {
			const lastFetched = new Date(user.last_fetch_at).getTime();
			const isCacheValid = Date.now() - lastFetched < threeHoursInMs;
			if (isCacheValid) {
				console.log("Serving user stats from Cache/DB...");
				const friends = await this.getFriendsFromDb(steamId);
				return [user, ...friends];
			}
		}
		console.log("Cache expired or empty. Fetching from Steam API...");
		const userStats = await this.loadUserStats(steamId);
		const { userAccessibility, statsToUpsert, gamesMetadata } =
			await this.loadFriendsGameStats(steamId);

		const result: UserDto[] = userStats.map((user) => ({
			...user,
			is_games_available: userAccessibility.get(user.steam_id) ?? false,
		}));

		await this.fetchDb(
			this.supabase.from("users").upsert(result, {
				onConflict: "steam_id",
				ignoreDuplicates: true,
			}),
			"Database upsert failed for users",
		);

		await this.recordFriendships(steamId);

		if (gamesMetadata.size > 0) {
			await this.recordNewGames({
				gamesData: Array.from(gamesMetadata.values()),
			});
		}

		const chunkSize = 1000;
		for (let i = 0; i < statsToUpsert.length; i += chunkSize) {
			const chunk = statsToUpsert.slice(i, i + chunkSize);
			await this.fetchDb(
				this.supabase.from("game_stats").upsert(chunk, {
					ignoreDuplicates: true,
				}),
				"Game stats upsert failed",
			);
		}

		await this.fetchDb(
			this.supabase
				.from("users")
				.update({ last_fetch_at: new Date().toISOString() })
				.eq("steam_id", steamId),
			"Failed to update user last_fetch_at timestamp",
		);

		return result;
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
			this.supabase.from("friendship").upsert(friendshipData, {
				onConflict: "user_id,friend_id",
				ignoreDuplicates: true,
			}),
			"Database upsert failed for friendships",
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
				.from("games")
				.upsert(toUpsert, { onConflict: "id", ignoreDuplicates: true }),
			"Database upsert failed for games",
		);

		return toUpsert;
	}

	async loadFriendsGameStats(id: string): Promise<{
		userAccessibility: Map<string, boolean>;
		statsToUpsert: {
			steam_id: string;
			appid: number;
			playtime_forever: number;
		}[];
		gamesMetadata: Map<
			number,
			{ id: number; name: string; icon_url: string | undefined }
		>;
	}> {
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
		const userAccessibility = new Map<string, boolean>();
		results.forEach((result, index) => {
			if (result.status === "fulfilled") {
				const steamId = allIds[index];
				const games = result.value;

				if (games.length === 0) {
					userAccessibility.set(steamId, false);
				} else {
					userAccessibility.set(steamId, true);
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
			}
		});

		return { userAccessibility, statsToUpsert, gamesMetadata };
	}

	async getUserSteamId(url: string): Promise<string> {
		console.log("url:", url);
		const userIdentifier = await this.extractSteamIdentifier(url);

		if (!userIdentifier) {
			throw new BadRequestException("Invalid Steam profile URL");
		}
		if (userIdentifier[0] === "profiles") {
			return userIdentifier[1];
		}

		const response = await this.fetchSteamApi<ResolveVanityURLResponse>(
			"ISteamUser/ResolveVanityURL/v0001",
			{
				vanityurl: userIdentifier[1],
			},
		);
		return response.response.steamid as string;
	}

	async extractSteamIdentifier(
		url: string,
	): Promise<["id" | "profiles", string] | null> {
		const regex = /steamcommunity\.com\/(id|profiles)\/([^/?#]+)/;
		const match = url.match(regex);

		return match ? [match[1] as "id" | "profiles", match[2]] : null;
	}

	async getUserGamesFromDB(id: string) {
		const data = await this.fetchDb(
			this.supabase.from("game_stats").select().eq("steam_id", id),
			"Failed to fetch user games from database",
		);
		return data;
	}

	async getHoursLeaderboard(
		steamid: string,
		appid: string,
	): Promise<LeaderboardResponseDto> {
		const data = await this.fetchDb<Leaderboard["leaderboard"]>(
			this.supabase.rpc("get_hours_leaderboard", {
				p_user_id: steamid,
				p_appid: appid,
			}),
			"Failed to fetch leaderboard from database",
		);
		const gameInfo = await this.supabase
			.from("games")
			.select("*")
			.eq("id", appid)
			.maybeSingle();
		return {
			game_info: gameInfo.data,
			leaderboard: data,
		};
	}

	private async fetchDb<T>(
		request: PromiseLike<{ data: T | null; error: any }>,
		errorMessage: string = "Database operation failed",
	): Promise<T> {
		const { data, error } = await request;
		if (error) {
			console.log(data, error);
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
		const key = this.configService.get<string>("STEAM");
		if (!key) {
			throw new InternalServerErrorException(
				"Steam API key not set in environment",
			);
		}

		const cleanPath = path.replace(/^\/|\/$/g, "");
		const url = new URL(`https://api.steampowered.com/${cleanPath}/`);

		url.searchParams.append("key", key);
		url.searchParams.append("format", "json");
		for (const [k, v] of Object.entries(params)) {
			url.searchParams.append(k, v);
		}

		console.log("REQUEST URL:", url.href);
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
