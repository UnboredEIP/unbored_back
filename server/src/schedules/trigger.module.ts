import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "src/auth/schemas/user.schema";
import { TriggerService } from "./trigger.service";
import { EventsSchema } from "src/events/schemas/events.schema";

@Module({
    imports:[MongooseModule.forFeature([{ name : 'Events', schema: EventsSchema}])],
    providers: [TriggerService]
})

export class TriggerModule {}