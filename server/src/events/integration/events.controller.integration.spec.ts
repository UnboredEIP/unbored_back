import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
import { EventsModule } from "../events.module";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";

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
            imports: [ConfigModule.forRoot({ isGlobal: true}), EventsModule, AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@localhost:27017/unboredEventsEnv`)],
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

    describe('get event information', () => {
        const createEventDto = {
            name: "testevent",
            address: "test event 93300",
            categories: ["test", "test2"]
        }

        it ('should return me an event', async() => {
            const create = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).get('/events/show?id='+create.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body)
        });

        it ('should not return me an event (bad id)', async() => {
            const badID = new Types.ObjectId();
            const response = await request(httpServer).get('/events/show?id='+badID).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toBe('Invalid Id');
        });

        it ('should not return me an event (id is not an ObjectId)', async() => {
            const badID = "hehe";
            const response = await request(httpServer).get('/events/show?id='+badID).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toMatch('Invalid Id');
        });
    })

    describe('creating and deleting event', () => {
        const createEventDto = {
            name: "testevent",
            address: "test event 93300",
            categories: ["test", "test2"]
        }

        it ('should create an event', async() => {
            const response = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.CREATED);
        })

        it ('should return me conflict', async() => {
            await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })

        it ('should delete an event', async() => {
            const create = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).delete('/events/delete?id='+create.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.message).toMatch("Succefully deleted !");
        })

        it ('should me return an error (bad id)', async() => {
            const badID = new Types.ObjectId();
            const response = await request(httpServer).delete('/events/delete?id='+badID).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toMatch("Could not find this event");
        });

        it ('should not return me an event (id is not an ObjectId)', async() => {
            const badID = "hehe";
            const response = await request(httpServer).delete('/events/delete?id='+badID).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toMatch("Invalid Id");

        });
    })

    describe('events manipulation', () => {
        const createEventDto = {
            name: "testevent",
            address: "test event 93300",
            categories: ["test", "test2"]
        }
        const create2EventDto = {
            name: "testevent1",
            address: "test event 93300",
            categories: ["test", "test2"]
        }
        it ("should edit event", async() => {
            const eventRes = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const modifiedEvent = {
                _id: eventRes.body.event._id,
                name: 'Hehe',
                address: 'test event 93300',
                rate: [],
                pictures: [],
                categories: ["test", "test2"]
            }
            const response = await request(httpServer).put('/events/edit?id='+eventRes.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer).send({"name": "Hehe"});
            expect(response.body.event).toMatchObject(modifiedEvent);
        })
        it ("should not edit event (bad id)", async() => {
            const response = await request(httpServer).put('/events/edit?id='+"falseid").set('Authorization', 'Bearer ' + eventUserBearer).send({"name": "Hehe"});
            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        })
        it ('should not edit event (not existing id)', async() => {
            const badId = new Types.ObjectId();
            const response = await request(httpServer).put('/events/edit?id='+badId._id).set('Authorization', 'Bearer ' + eventUserBearer).send({"name": "Hehe"});
            expect(response.status).toBe(HttpStatus.NOT_FOUND)

        })

        it ('should not edit event (duplicate key (name)', async() => {
            await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const eventRes = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(create2EventDto);
            const response = await request(httpServer).put('/events/edit?id='+eventRes.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer).send({"name": "testevent"});
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })
    })
});
