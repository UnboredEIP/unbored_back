import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../auth/schemas/user.schema';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports:[MongooseModule.forFeature([{ name : 'User', schema: UserSchema}])],
    controllers: [ProfileController],
    providers: [ProfileService, JwtStrategy],
})

export class ProfileModule {}
