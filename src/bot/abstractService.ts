import { Telegraf } from 'telegraf';

export abstract class AbstractService {
    protected log(message: string): void {
        console.debug(new Date().toISOString() + ' [Poker tracker] ' + message);
    }
}