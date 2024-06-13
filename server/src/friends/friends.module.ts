import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/auth/schemas/user.schema';
import { FriendsService } from './friends.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { FriendsController } from './friends.controller';

@Module({
    imports: [MongooseModule.forFeature([{name: 'User', schema: UserSchema}])],
    providers: [FriendsService, JwtStrategy],
    controllers: [FriendsController]
})

export class FriendsModule {}
