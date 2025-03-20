import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Get API health status' })
    @ApiResponse({ status: 200, description: 'API is healthy' })
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
}