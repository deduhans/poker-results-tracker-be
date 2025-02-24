import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from "express-session"
import * as passport from "passport";
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  console.log(`http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`)
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const options = new DocumentBuilder()
    .setTitle('Your API Title')
    .setDescription('Your API description')
    .setVersion('1.0')
    .addServer(`http://${process.env.NEST_HOST}:${process.env.NEST_PORT}/`, 'Local environment')
    .addTag('Your API Tag')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document as any);

  app.use(
    session({
      secret: `${process.env.PASSPORT_SECRET}`,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 18000000 // 5 hours
      }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const corsOptions: CorsOptions = {
    origin: `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`,
    //origin: `http://localhost:3001`,
    credentials: true,
  };

  app.enableCors(corsOptions);
  await app.listen(process.env.NEST_PORT || 3000);
}
bootstrap();
