import { Telegraf } from 'telegraf';

export abstract class AbstractService {

    protected bot: Telegraf;
    
    constructor(
        bot: Telegraf
    ) {
        this.bot = bot;
    }

    protected abstract init(): any;

    protected log(message: string): void {
        console.debug(new Date().toISOString() + ' [Poker tracker] ' + message);
    }
}