import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/auth/schemas/user.schema';
import { GroupSchema } from './schemas/group.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: 'User', schema: UserSchema}]), MongooseModule.forFeature([{name: 'Groups', schema: GroupSchema}])],
  providers: [GroupsService, JwtStrategy],
  controllers: [GroupsController]
})
export class GroupsModule {}
