import type { Database, Tables } from '../../db/database.types';

export type user = Tables<'users'>;
export type game = Tables<'games'>;
export type LeaderboardResponse =
  Database['public']['Functions']['get_leaderboard']['Returns'];
