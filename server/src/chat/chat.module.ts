import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.services';
import { UserSchema } from 'src/auth/schemas/user.schema';
import { MessageSchema } from './schemas/chat.schema';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema}]),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
})

export class ChatModule {}
