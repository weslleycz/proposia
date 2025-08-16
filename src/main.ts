import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UserEntity } from './modules/users/entities/user.entity';
import { ClientEntity } from './modules/clients/entities/client.entity';
import { ProposalItem } from './modules/proposal-items/entities/proposal-item.entity';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    app.use(passport.initialize())

  const options = new DocumentBuilder()
    .setTitle('API Documentation')
    .setVersion('1.0')
     .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [UserEntity, ClientEntity, ProposalItem],
  });

  SwaggerModule.setup('/api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
