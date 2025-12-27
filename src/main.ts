import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

function validateEnv() {
  const required = ['PASSPORT_SECRET', 'NEST_PORT', 'NEST_HOST', 'CLIENT_HOST', 'CLIENT_PORT'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger Setup
  const options = new DocumentBuilder()
    .setTitle('Poker Results Tracker API')
    .setDescription('API for tracking poker game results')
    .setVersion('1.0')
    .addServer(`http://${process.env.NEST_HOST}:${process.env.NEST_PORT}/`, 'Local environment')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // CORS Setup
  const clientHost = process.env.CLIENT_HOST;
  const clientPort = process.env.CLIENT_PORT;
  const isHttps = clientPort === '443' || (clientHost && clientHost.includes('netlify.app'));
  const protocol = isHttps ? 'https' : 'http';

  const originPort = (clientPort === '443' || clientPort === '80') ? '' : `:${clientPort}`;
  const corsOptions: CorsOptions = {
    origin: [`${protocol}://${clientHost}${originPort}`],
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Start Server
  await app.listen(parseInt(`${process.env.NEST_PORT}`) || 3000, '0.0.0.0');
  console.log(
    `Application is running on: http://${process.env.NEST_HOST}:${process.env.NEST_PORT}`,
  );
  console.log(
    `CORS enabled for: ${protocol}://${clientHost}${originPort}`,
  );
}

bootstrap();
