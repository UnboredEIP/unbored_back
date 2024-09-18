import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { EventModule } from './event/event.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { GroupModule } from './group/group.module';
import { EventsModule } from './events/events.module';
import { FriendsModule } from './friends/friends.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './schedules/cron.module';
import { TriggerModule } from './schedules/trigger.module';
import { GroupsModule } from './groups/groups.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, ProfileModule, EventModule, ChatModule, GroupModule, DatabaseModule.forRoot(""), ConfigModule.forRoot({ isGlobal: true}), EventsModule, FriendsModule, CronModule, TriggerModule, GroupsModule, QrcodeModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
