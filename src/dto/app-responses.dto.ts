import { ApiProperty } from "@nestjs/swagger";
import { LeaderboardResponse } from '../common/db.types';

type leaderboard = LeaderboardResponse[number];
export class LeaderboardResponseDto implements leaderboard {
  appid: string;
  steam_id: string;
  playtime_forever: string;
}
