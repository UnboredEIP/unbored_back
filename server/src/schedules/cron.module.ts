import { Module } from "@nestjs/common";
import { CronService } from "./cron.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "src/auth/schemas/user.schema";
import { EventsSchema } from "src/events/schemas/events.schema";

@Module({
    imports:[MongooseModule.forFeature([{ name : 'User', schema: UserSchema}]), MongooseModule.forFeature([{name: 'Events', schema: EventsSchema}])],
    providers: [CronService]
})

export class CronModule {}