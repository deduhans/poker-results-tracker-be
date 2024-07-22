import { RoomService } from './bot/roomService';
import { Telegraf } from 'telegraf';
import {telegramEnv} from './config'

export class ApplicationContext {
  private beans: Record<string, any> = {};

  constructor() {
    this.log('Starting constructor');

    const token = telegramEnv.token;
    const bot = new Telegraf(token)
    
    const roomService = new RoomService(bot);

    this.beans[RoomService.name] = roomService;

    this.log('Context started');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    bot.launch();
  }

  private log(message: string): void {
    console.debug(new Date().toISOString() + ' [Poker tracker] ' + message);
  }

  getBean<T>(name: string): T {
    return this.beans[name] as T;
  }
}