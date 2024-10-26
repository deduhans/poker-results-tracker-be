import 'reflect-metadata';
import { Controller, Body, Post, Get } from 'routing-controllers';
import { RoomService } from './roomService';
import { log } from 'console';

@Controller()
export class RoomController {
    private roomService: RoomService = new RoomService();

    @Get("/room")
    getRoom() {
        log("dfdf");
    }

    @Post('/room')
    createRoom(@Body() user: number) {
        this.roomService.createRoom(user);
    }
}
