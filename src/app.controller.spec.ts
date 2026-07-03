import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { SteamService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let steamService: SteamService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: SteamService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
            getTestData: jest.fn().mockResolvedValue([{ id: 1 }]),
            getOwnedGames: jest.fn().mockResolvedValue([]),
            getFriendList: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    steamService = app.get<SteamService>(SteamService);
  });

  describe('test', () => {
    it('should return mock test data', async () => {
      const response = await appController.test('123');
      expect(response).toEqual({
        message: 'This action returns a #123 cat; hello: Hello World!',
        data: [{ id: 1 }],
      });
      expect(steamService.getTestData).toHaveBeenCalled();
    });
  });
});

