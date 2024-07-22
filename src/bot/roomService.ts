import { Telegraf } from "telegraf";
import { AbstractService } from "./abstractService";
import { RoomDAO } from "./roomDAO";

export class RoomService extends AbstractService {
    private roomDAO: RoomDAO;

    constructor(bot: Telegraf) {
        super(bot);

        this.roomDAO = new RoomDAO();
        this.init();
    };

    protected init() {
        this.bot.command('create', (ctx) => {
            const userId = ctx.from.id;
            this.roomDAO.createRoom(userId);
        });
    };
}