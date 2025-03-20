import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "@entities/payment.entity";
import { Player } from "@entities/player.entity";
import { Room } from "@entities/room.entity";
import { User } from "@entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class E2EService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) { }

    async clearDatabase(): Promise<void> {
        // Clear in order: child tables first, then parent tables
        await this.paymentRepository.delete({});  // Payments depend on players
        await this.playerRepository.delete({});   // Players depend on users and rooms
        await this.roomRepository.delete({});     // Rooms depend on users
        await this.userRepository.delete({});     // Users have no dependencies
    }
}
