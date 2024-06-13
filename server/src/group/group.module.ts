import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../auth/schemas/user.schema';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupSchema } from '../groups/schemas/group.schema';

@Module({
    imports: [MongooseModule.forFeature([{name: 'User', schema: UserSchema}]), MongooseModule.forFeature([{name: 'Groups', schema: GroupSchema}])],
    providers: [GroupService, JwtStrategy],
    controllers: [GroupController]
})

export class GroupModule {}