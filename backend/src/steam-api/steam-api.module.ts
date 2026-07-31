import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SteamApiService } from "./steam-api.service";

@Module({
	imports: [ConfigModule],
	providers: [SteamApiService],
	exports: [SteamApiService],
})
export class SteamApiModule {}
