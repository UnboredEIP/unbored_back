import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
import { EventModule } from "../event.module";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";
import { EventsModule } from "src/events/events.module";

const User1 = {
    username: "testusernameevent",
    email: "testemailevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

const fakeUser = {
    username: "fakeuserevent",
    email: "fakeuserevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}


describe('EventController', () => {
    let dbConnection: Connection;
    let httpServer: any;
    let app: any;
    let eventUserBearer: string;
    let fakeUserBearer: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), EventModule, AuthModule, EventsModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@localhost:27017/unboredEventEnv`)],
            providers: [{provide: getModelToken(User.name), useValue: {}}]
        }).compile();

        app = await moduleRef.createNestApplication();
        await app.init();
        dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
        httpServer = await app.getHttpServer();
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('events').deleteMany({});
    }, 10000)

    beforeEach(async () => {
        await request(httpServer).post('/auth/register/pro').send(User1)
        await request(httpServer).post('/auth/register').send(fakeUser)

        const login = (await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password}))
        const login1 = (await request(httpServer).post('/auth/login').send({email: fakeUser.email}).send({passwword: fakeUser.password}))
        eventUserBearer = login.body.token;
        fakeUserBearer = login1.body.token;
        await dbConnection.collection('users').deleteOne({username: fakeUser.username});

    }, 10000);

    afterEach(async () => {
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('events').deleteMany({});
    }, 10000)

    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('events').deleteMany({});
    }, 10000)


    describe('user reservations', () => {
        const events = ['123', 'dsqdqs', 'mddd'];
        const deletedEventRes = ['mddd'];

        // it ('should add reservations to user1', async() => {
        //     const response = await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({"events": ["123", "123", "dsqdqs", "mddd"]});
        //     expect(response.status).toBe(HttpStatus.OK);
        //     expect(response.body.reservations).toMatchObject(events);
        // })
        // it ('should return me user1 reservations', async() => {
        //     await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({"events": ["123", "123", "dsqdqs", "mddd"]});
        //     const response = await request(httpServer).get('/event').set('Authorization', 'Bearer ' + eventUserBearer)
        //     expect(response.status).toBe(HttpStatus.OK);
        //     expect(response.body.reservations).toMatchObject(events);
        // })

        // it ('should delete users reservations', async() => {
        //     await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({"events": ["123", "123", "dsqdqs", "mddd"]});
        //     const response = await request(httpServer).delete('/event/delete').set('Authorization', 'Bearer ' + eventUserBearer).send({"events": ["123", "123", "dsqdqs", ]});
        //     expect(response.status).toBe(HttpStatus.OK);
        //     expect(response.body.reservations).toMatchObject(deletedEventRes);
        // });

    })

    describe('add / delete event rate', () => {
        const rateEventDto = {
            stars: "2.5",
            comments: "bieng"
        }
        const createEventDto = {
            name: "testevent",
            address: "test event 93300",
            categories: ["test", "test2"]
        }
        it ("should create rate in event db", async() => {
            const eventRes = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const eventId = eventRes.body.event._id;
            const response = await request(httpServer).post('/event/rate?id='+eventId).set('Authorization', 'Bearer ' + eventUserBearer).send(rateEventDto)
            expect(response.body.event.rate[0]).toMatchObject(rateEventDto);
            expect(response.status).toBe(HttpStatus.OK);
        });

        it ("should return me an error (invalid id)", async() => {
            const response = await request(httpServer).post('/event/rate?id='+"badId").send(rateEventDto).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        })

        it ("should return me an error (not existing id)", async() => {
            const badId = new Types.ObjectId();
            const response = await request(httpServer).post('/event/rate?id='+badId._id).send(rateEventDto).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        });

        it ("should delete the rate i posted", async() => {
            const eventRes = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const eventId = eventRes.body.event._id;
            const rateId = await request(httpServer).post('/event/rate?id='+eventId).set('Authorization', 'Bearer ' + eventUserBearer).send(rateEventDto)
            const response = await request(httpServer).delete('/event/rate').set('Authorization', 'Bearer ' + eventUserBearer).send({"rateId" : rateId.body.event.rate[0].id})
            expect(response.body.rates).toMatchObject([]);
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ("should return me an error (Not existing rate id)", async() => {
            const response = await request(httpServer).delete('/event/rate').set('Authorization', 'Bearer ' + eventUserBearer).send({"rateId" : "nothing"})
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        })
    })
});
