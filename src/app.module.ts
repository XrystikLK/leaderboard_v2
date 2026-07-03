import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { SteamService } from './app.service';
import { SupabaseModule } from 'nestjs-supabase-js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        supabaseUrl: configService.get<string>('SUPABASE_URL') || '',
        supabaseKey: configService.get<string>('SUPABASE_KEY') || '',
      }),
    }),
    SupabaseModule.injectClient(),
  ],
  controllers: [AppController],
  providers: [SteamService],
})
export class AppModule { }