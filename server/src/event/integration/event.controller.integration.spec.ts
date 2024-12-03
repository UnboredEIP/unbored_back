import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import mongoose, { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
import { EventModule } from "../event.module";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";
import { EventsModule } from "src/events/events.module";
import * as path from 'path';
import * as fs from 'fs';

const User1 = {
    username: "testusernameevent",
    email: "testemailevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

const adminUser = {
    username: "adminuserevent",
    email: "adminuserevent@email.com",
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
    let adminUserBearer: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), EventModule, AuthModule, EventsModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@${process.env.URL}:27017/unboredEventEnv`)],
            providers: [
                {provide: getModelToken(User.name), useValue: {}},
            ]
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
        await request(httpServer).post('/auth/register/pro').send(adminUser)

        const login = (await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password}))
        const login1 = (await request(httpServer).post('/auth/login').send({email: adminUser.email}).send({password: adminUser.password}))
        eventUserBearer = login.body.token;
        adminUserBearer = login1.body.token;
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
        it ('should show user reservations', async() => {
            const response = await request(httpServer).get('/event/').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should show user reservations', async() => {
            const response = await request(httpServer).get('/event/reservations').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        })
    })

    describe('add event to profile', () => {
        it ('should add event to user', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            const response = await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const p = await dbConnection.collection('events').findOne({_id: new mongoose.Types.ObjectId(event.body.event._id)})
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            const validate = p.participents.filter((item) => {
                return item.user === u._id.toString();
            });
            expect(validate.length).toBe(1)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should not add event (already registered)', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const response = await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })

    describe('delete event from profile', () => {
        it ('should correctly delete registered event', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const response = await request(httpServer).delete('/event/delete').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const p = await dbConnection.collection('events').findOne({_id: new mongoose.Types.ObjectId(event.body.event._id)})
            expect(p.participents.length).toBe(0)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should not deleting anything (not existing id)', async() => {
            const fakeId = new Types.ObjectId();
            const response = await request(httpServer).delete('/event/delete').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [fakeId.toString()]})
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })

    describe('imaging', () => {
        it ('should upload image to event', async() => {
            const testImagePath = path.join(__dirname, 'test.png');

            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            const response = await request(httpServer).post('/event/upload?id='+event.body.event._id).set('Authorization', 'Bearer '+ adminUserBearer).attach('file', testImagePath)

            const e = await dbConnection.collection('events').findOne({_id: new mongoose.Types.ObjectId(event.body.event._id)})
            const uploadedImagePath = path.join('./data/images', e.pictures[0].id);
            expect(response.status).toBe(HttpStatus.OK)
            expect(fs.existsSync(uploadedImagePath)).toBe(true);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
            }
            expect(fs.existsSync(uploadedImagePath)).toBe(false);
        })
        it ('should not upload image to event (false id)', async() => {
            const fakeId = new Types.ObjectId();
            const testImagePath = path.join(__dirname, 'test.png');
            const response = await request(httpServer).post('/event/upload?id='+fakeId.toString()).set('Authorization', 'Bearer '+ adminUserBearer).attach('file', testImagePath)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })

    describe('favorites', () => {
        it ('should add to favorites', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            const response = await request(httpServer).post('/event/favorites/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should not add anything (not existing id)', async() => {
            const fakeId = new Types.ObjectId();
            const response = await request(httpServer).post('/event/favorites/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [fakeId.toString()]})
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ('should delete from favorites', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/favorites/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const response = await request(httpServer).delete('/event/favorites/delete').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id.toString()]})
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            expect(u.favorites.length).toBe(0)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should not add anything (not existing id)', async() => {
            const fakeId = new Types.ObjectId();
            const response = await request(httpServer).delete('/event/favorites/delete').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [fakeId.toString()]})
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })

    describe('ticketing', () => {
        it ('should generate ticket for user', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const response = await request(httpServer).get('/event/ticket?event='+event.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should not generate ticket (false id)', async() => {
            const fakeId = new Types.ObjectId();
            const response = await request(httpServer).get('/event/ticket?event='+fakeId.toString()).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ('should not generate ticket (not registered user)', async() => {
            const eventDto = {
                name: "basket entre pote",
                address: "12 rue valmy",
                categories: ["basket"],
            }
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            const response = await request(httpServer).get('/event/ticket?event='+event.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
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
