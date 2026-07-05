/* eslint-disable prettier/prettier */
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
import { SupabaseClient } from "@supabase/supabase-js";
import { InjectSupabaseClient } from "nestjs-supabase-js";

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
		const { data, error } = await this.supabase.from("test").select();

		if (error) {
			throw new InternalServerErrorException(
				`Database query failed: ${error.message}`,
			);
		}

		return data;
	}

	async getOwnedGames(steamId: string) {
		return this.fetchSteamApi<GetOwnedGamesResponse>(
			"IPlayerService/GetOwnedGames/v0001",
			{
				steamid: steamId,
				include_appinfo: "true",
			},
		);
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

	async getPlayerSummaries(steamIds: string[]) {
		return this.fetchSteamApi<GetPlayerSummariesResponse>(
			"ISteamUser/GetPlayerSummaries/v0002",
			{
				steamids: steamIds.join(","),
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
			if (result.status === "fulfilled") {
				acc.push(...result.value);
			}
			return acc;
		}, []);

		if (usersToUpsert.length === 0) {
			return [];
		}

		const { error } = await this.supabase
			.from("users")
			.upsert(usersToUpsert, { ignoreDuplicates: true });

		if (error) {
			throw new InternalServerErrorException(
				`Database upsert failed: ${error.message}`,
			);
		}
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

		const { error } = await this.supabase
			.from("friendship")
			.upsert(friendshipData, {
				onConflict: "user_id,friend_id",
				ignoreDuplicates: true,
			});

		if (error) {
			console.log(error);
			throw new InternalServerErrorException(
				`Database upsert failed for friendships: ${error.message}`,
			);
		}

		return friendshipData;
	}

	async getUserSteamId(vanityurl: string): Promise<string | undefined> {
		const response = await this.fetchSteamApi<ResolveVanityURLResponse>(
			"ISteamUser/ResolveVanityURL/v0001",
			{
				vanityurl,
			},
		);
		return response.response.steamid;
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

		// console.log('REQUEST URL:', url);
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
