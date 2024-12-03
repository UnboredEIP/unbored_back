import { DynamicModule, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseService } from "./database.service";

@Module({})
export class DatabaseModule {
    static forRoot(uri?: string) : DynamicModule {
        console.log("URI :", !uri ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@mongodb:27017/unbored` : uri)
        return {
            module: DatabaseModule,
            // imports: [MongooseModule.forRootAsync({
            //     useFactory: (configService: ConfigService) => ({
            //         uri: configService.get<string>('NODE_ENV') === "test"
            //         ? uri
            //         : `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@mongodb:27017/unbored`
            //     }),
            //     inject: [ConfigService]
            // })],
            imports: [MongooseModule.forRootAsync({
                useFactory: (configService: ConfigService) => ({
                    uri: !uri ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@mongodb:27017/unbored` : uri
                }),
                inject: [ConfigService]
            })],
            providers: [DatabaseService],
            exports: [DatabaseService]
        }
    }
}