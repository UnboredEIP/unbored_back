import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/auth/schemas/user.schema';
import { EventsController } from './events.controller';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { EventsSchema } from './schemas/events.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema}]), MongooseModule.forFeature([{name: 'Events', schema: EventsSchema}])],
  providers: [EventsService, JwtStrategy],
  controllers: [EventsController]
})

export class EventsModule {}
