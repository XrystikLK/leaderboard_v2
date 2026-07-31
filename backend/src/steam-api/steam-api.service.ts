import {
	HttpException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { GetOwnedGamesResponse } from "@oddlaceguy49/steam-web-api-types/types/IPlayerService";
import type {
	GetFriendListResponse,
	GetPlayerSummariesResponse,
	ResolveVanityURLResponse,
} from "@oddlaceguy49/steam-web-api-types/types/ISteamUser";
import type {
	GetPlayerAchievementsResponse,
	GetSchemaForGameResponse,
} from "@oddlaceguy49/steam-web-api-types/types/ISteamUserStats";

@Injectable()
export class SteamApiService {
	constructor(private readonly configService: ConfigService) {}

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

	async getOwnedGames(steamId: string): Promise<GetOwnedGamesResponse> {
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

	async getFriendList(steamId: string): Promise<GetFriendListResponse> {
		return this.fetchSteamApi<GetFriendListResponse>(
			"ISteamUser/GetFriendList/v0001",
			{
				steamid: steamId,
				relationship: "friend",
			},
		);
	}

	async getPlayerSummaries(
		steamIds: string[],
	): Promise<GetPlayerSummariesResponse> {
		return this.fetchSteamApi<GetPlayerSummariesResponse>(
			"ISteamUser/GetPlayerSummaries/v0002",
			{
				steamids: steamIds.join(","),
			},
		);
	}

	async resolveVanityUrl(vanityUrl: string): Promise<ResolveVanityURLResponse> {
		return this.fetchSteamApi<ResolveVanityURLResponse>(
			"ISteamUser/ResolveVanityURL/v0001",
			{
				vanityurl: vanityUrl,
			},
		);
	}
}
