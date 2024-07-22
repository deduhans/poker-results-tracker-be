import { Telegraf } from 'telegraf';
import { connect } from 'ts-postgres';
import { AbstractService } from './abstractService';

export class BotService extends AbstractService {
    constructor(
        bot: Telegraf
    ) {
        super(bot);
        // start bot
        this.init();
    }

    protected init() {
        this.bot.start((ctx) => {
            ctx.reply('Hello ' + ctx.from.first_name + '!');
        });
        this.bot.help((ctx) => {
            ctx.reply('Send /start to receive a greeting');
            ctx.reply('Send /keyboard to receive a message with a keyboard');
            ctx.reply('Send /quit to stop the bot');
        });
        this.bot.command('quit', (ctx) => {
            ctx.telegram.leaveChat(ctx.message.chat.id);
        });
        this.bot.command('createUser', (ctx) => {
        });

        this.bot.launch();
    }

    

    private async createUser(){    
        const client = await connect({
            "user": 'postgres',
            "password": 'postgres'
        });

        client.query('insert into tbl_user (id) values (5);');
    }
}