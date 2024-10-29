import { Controller, Get } from "@nestjs/common";
import { E2EService } from "./e2e.service";

@Controller('e2e')
export class E2EController {
    constructor(private readonly e2eService: E2EService) { }

    @Get()
    async truncateAll(): Promise<any> {
        return await this.e2eService.truncateAll();
    }
}
