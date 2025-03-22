import {
    Body,
    Controller,
    Post,
    UseGuards
} from '@nestjs/common';
import { ExchangeService } from '@app/exchange/exchange.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateExchangeDto } from '@app/exchange/types/CreateExchangeDto';
import { ExchangeDto } from '@app/exchange/types/ExchangeDto';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';

@UseGuards(AuthenticatedGuard)
@Controller('exchanges')
export class ExchangeController {
    constructor(private readonly exchangeService: ExchangeService) { }

    @Post()
    @ApiBody({ type: CreateExchangeDto })
    @ApiResponse({ type: ExchangeDto })
    async createExchange(@Body() createExchange: CreateExchangeDto): Promise<ExchangeDto> {
        const exchange = await this.exchangeService.createExchange(createExchange);

        return plainToInstance(ExchangeDto, exchange);
    }
}
