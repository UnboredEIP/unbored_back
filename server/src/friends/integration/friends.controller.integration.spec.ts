import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";
import { FriendsModule } from "../friends.module";
import { ProfileModule } from "src/profile/profile.module";

const User1 = {
    username: "testusernameevent",
    email: "testemailevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

const User2 = {
    username: "testusernameevent2",
    email: "testemailevent2@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

describe('FriendController', () => {
    let dbConnection: Connection;
    let httpServer: any;
    let app: any;
    let User1Bearer: string;
    let User2Bearer: string;
    let User1Id: string;
    let User2Id: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), FriendsModule, AuthModule, ProfileModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@${process.env.URL}:27017/unboredFriendsEnv`)],
            providers: [{provide: getModelToken(User.name), useValue: {}}]
        }).compile();

        app = await moduleRef.createNestApplication();
        await app.init();
        dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
        httpServer = await app.getHttpServer();
        await dbConnection.collection('users').deleteMany({});
    }, 10000)


    beforeEach(async () => {
        await request(httpServer).post('/auth/register').send(User1)
        await request(httpServer).post('/auth/register').send(User2)

        const login = (await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password}))
        const login1 = (await request(httpServer).post('/auth/login').send({email: User2.email}).send({password: User2.password}))

        User1Bearer = login.body.token;
        User2Bearer = login1.body.token;
        User1Id = (await dbConnection.collection('users').findOne({email: User1.email}))._id.toString();
        User2Id = (await dbConnection.collection('users').findOne({email: User2.email}))._id.toString();

    }, 10000);

    afterEach(async () => {
        await dbConnection.collection('users').deleteMany({});
    }, 10000)

    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
    }, 10000)

    describe('friends information', () => {
        it ("should return me friend list", async() => {
            const response = await request(httpServer).get('/friends/').set('Authorization',  'Bearer ' + User1Bearer)
            expect(response.status).toBe(HttpStatus.OK);
        })
        it ("should return me friend invitation list", async() => {
            const response = await request(httpServer).get('/friends/invitations').set('Authorization',  'Bearer ' + User1Bearer)
            expect(response.status).toBe(HttpStatus.OK);
        })
    })

    describe('friends invitation managements', () => {
        it ("should send an invitation to user2", async() => {
            const response = await request(httpServer).post('/friends/invite?user_id='+User2Id).set('Authorization',  'Bearer ' + User1Bearer)
            const friendlist = await request(httpServer).get('/friends/invitations').set('Authorization',  'Bearer ' + User2Bearer)

            expect(response.status).toBe(HttpStatus.OK);
            expect(friendlist.body.invitations.length).toBe(1);
        })

        it ("should return me an error (my id)", async() => {
            const response = await request(httpServer).post('/friends/invite?user_id='+User1Id).set('Authorization',  'Bearer ' + User1Bearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ("should return me an error (wrong id)", async() => {
            const response = await request(httpServer).post('/friends/invite?user_id='+"caca").set('Authorization',  'Bearer ' + User1Bearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ("should return me an error (sending 1 invitation to someone who already have one)", async() => {
            await request(httpServer).post('/friends/invite?user_id='+User2Id).set('Authorization',  'Bearer ' + User1Bearer)
            const response = await request(httpServer).post('/friends/invite?user_id='+User2Id).set('Authorization',  'Bearer ' + User1Bearer)
            expect(response.status).toBe(HttpStatus.CONFLICT)
        })
    })

    describe('friend accept managament', () => {
        it ("should accept friend invitation", async() => { 
            await request(httpServer).post('/friends/invite?user_id='+User2Id).set('Authorization',  'Bearer ' + User1Bearer)
            const response = await request(httpServer).post('/friends/accept?user_id='+User1Id).set('Authorization',  'Bearer ' + User2Bearer)
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })

        it ("should return me error (no invitation)", async() => { 
            const response = await request(httpServer).post('/friends/accept?user_id='+User1Id).set('Authorization',  'Bearer ' + User2Bearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })

    describe('friend deletation management', () => {
        it ("should delete friend", async() => { 
            await request(httpServer).post('/friends/invite?user_id='+User2Id).set('Authorization',  'Bearer ' + User1Bearer)
            await request(httpServer).post('/friends/accept?user_id='+User1Id).set('Authorization',  'Bearer ' + User2Bearer)
            const response = await request(httpServer).delete('/friends/delete?user_id='+User1Id).set('Authorization',  'Bearer ' + User2Bearer)
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })

        it ("should return me error (not in friend list)", async() => { 
            const response = await request(httpServer).delete('/friends/delete?user_id='+User1Id).set('Authorization',  'Bearer ' + User2Bearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })
})