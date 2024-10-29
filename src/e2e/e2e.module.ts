import { Module } from "@nestjs/common";
import { E2EService } from "./e2e.service";
import { E2EController } from "./e2e.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "src/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Payment])],
    controllers: [E2EController],
    providers: [E2EService]
  })
  export class E2EModule {}
  