import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from "express-basic-auth"
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.use("/api", basicAuth({
    challenge: true,
    users: {
      unbored: process.env.API_DOC_PASSWORD,
    }
  }))

  const config = new DocumentBuilder()
    .addBearerAuth(
      {
        name: 'Token',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        description: 'Enter Token',
        type: 'http',
        in: 'Header',
      },
      'authorization'
    )
    .setTitle('Unbored')
    .setDescription('Unbored API description')
    .addTag('General', 'These are all routes used globaly in API')
    .addTag('Authentication', 'Use these route to login/register to get an access token')
    .addTag('Password Management', 'Use these route to reset your password')
    .addTag('Profile', 'Use these route for Profile informations')
    .addTag('Users Event', 'Use these route for Users Event informations')
    .addTag('Global Events', 'Use these route for Global Event informations')
    .addTag('Users Group', 'Use these route for user group management')
    .addTag('Global Groups', 'Use these route for groups management')
    .addTag('Friends', 'Use these route to manage your friends')
    .setVersion('1.0')
    .build();
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)

  await app.listen(parseInt(process.env.PORT));
}
bootstrap();