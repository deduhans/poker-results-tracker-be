import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "src/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class E2EService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    ) {}

    async truncateAll(): Promise<void> {
        const tables: string[] = [
            'payment',
            'player',
            'room',
            'user',
        ];

        tables.forEach(async table => {
            await this.paymentRepository.query(`TRUNCATE TABLE "${table}" CASCADE;`)
        });
    }
}
