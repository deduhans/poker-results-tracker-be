import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ExchangeService } from '@app/exchange/exchange.service';
import { ApiBody, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateExchangeDto } from '@app/exchange/types/CreateExchangeDto';
import { ExchangeDto } from '@app/exchange/types/ExchangeDto';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';
import { ExchangeDirectionEnum } from './types/ExchangeDirectionEnum';

@UseGuards(AuthenticatedGuard)
@Controller('exchanges')
@ApiTags('exchanges')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post()
  @ApiBody({ type: CreateExchangeDto })
  @ApiResponse({ type: ExchangeDto })
  async createExchange(@Body() createExchange: CreateExchangeDto): Promise<ExchangeDto> {
    const exchange = await this.exchangeService.createExchange(createExchange);
    return plainToInstance(ExchangeDto, exchange);
  }

  @Post('cash-out')
  @ApiBody({ type: CreateExchangeDto })
  @ApiResponse({ type: ExchangeDto })
  async cashOut(@Body() createExchange: CreateExchangeDto): Promise<ExchangeDto> {
    // Enforce cash out type
    createExchange.type = ExchangeDirectionEnum.CashOut;
    const exchange = await this.exchangeService.createExchange(createExchange);
    return plainToInstance(ExchangeDto, exchange);
  }

  @Get('player/:playerId/balance')
  @ApiParam({ name: 'playerId', type: Number })
  @ApiResponse({ type: String })
  async getPlayerChipBalance(@Param('playerId', ParseIntPipe) playerId: number): Promise<{ balance: string }> {
    const balance = await this.exchangeService.calculatePlayerChipBalance(playerId);
    return { balance };
  }
}
