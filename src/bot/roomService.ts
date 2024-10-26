import { Telegraf } from "telegraf";
import { AbstractService } from "./abstractService";
import { RoomDAO } from "./roomDAO";

export class RoomService extends AbstractService {
    private roomDAO: RoomDAO = new RoomDAO();

    public createRoom(host: number) {
        this.roomDAO.createRoom(host);
    }
}