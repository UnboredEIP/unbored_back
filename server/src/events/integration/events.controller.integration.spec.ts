import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import mongoose, { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
import { EventsModule } from "../events.module";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";
import * as path from 'path';
import * as fs from 'fs';
import { EventModule } from "src/event/event.module";

const User1 = {
    username: "testusernameevent",
    email: "testemailevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

const adminUser = {
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
    let adminUserBearer: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), EventsModule, EventModule, AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@localhost:27017/unboredEventsEnv`)],
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

    describe('get event information', () => {
        const createEventDto = {
            name: "testevent",
            address: "test event 93300",
            categories: ["test", "test2"],
            email: User1.email
        }

        it ('should list my events (private + public)', async() => {
            const response = await request(httpServer).get('/events/lists').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should list all public events', async() => {
            const response = await request(httpServer).get('/events/lists/all').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should list all public events', async() => {
            await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).get('/events/lists/all?email='+User1.email).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.body.events.length).toBe(1)
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should list only return me 2 events (pagination)', async() => {
            for (let i = 0; i != 5; i++) {
                createEventDto.name = createEventDto.name + i.toString()
                await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            }
            const response = await request(httpServer).get('/events/lists/all?pageSize=2').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.body.events.length).toBe(2)
        })

        it ('should not returning any events (bad pagination calling)', async() => {
            for (let i = 0; i != 5; i++) {
                createEventDto.name = createEventDto.name + i.toString()
                await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            }
            const response = await request(httpServer).get('/events/lists/all?pageSize=-1').set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ('should return me an event (get event by id)', async() => {
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
            categories: ["test", "test2"],
            start_date: new Date ("2024-12-05"),
            end_date: new Date ("2024-12-10")
        }

        it ('should create an event', async() => {
            const response = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.CREATED);
        })

        it ('should return me conflict (duplicate event)', async() => {
            await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })

        it ('should not create an event (date end < date start)', async() => {
            createEventDto.end_date = new Date("2023-12-10");
            const response = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toBe("end_date should be greater than start_date")
            createEventDto.end_date = new Date("2024-12-10");
        })

        it ('should delete an event', async() => {
            const create = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            const response = await request(httpServer).delete('/events/delete?id='+create.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.message).toMatch("Succefully deleted !");
        })

        it ('should delete event and image from event', async() => {
            const testImagePath = path.join(__dirname, 'test.png');
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto)
            await request(httpServer).post('/event/upload?id='+event.body.event._id).set('Authorization', 'Bearer '+ eventUserBearer).attach('file', testImagePath)
            const response = await request(httpServer).delete('/events/delete?id='+event.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.OK)
        })

        it ('should delete event even if image has already been deleted', async() => {
            const testImagePath = path.join(__dirname, 'test.png');
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto)
            await request(httpServer).post('/event/upload?id='+event.body.event._id).set('Authorization', 'Bearer '+ eventUserBearer).attach('file', testImagePath)
            const e = await dbConnection.collection('events').findOne({_id: new mongoose.Types.ObjectId(event.body.event._id)})
            const uploadedImagePath = path.join('./data/images', e.pictures[0].id);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
            }
            const response = await request(httpServer).delete('/events/delete?id='+event.body.event._id).set('Authorization', 'Bearer ' + eventUserBearer);
            expect(response.status).toBe(HttpStatus.OK)
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

        it ('should create private event', async() => {
            const response = await request(httpServer).post('/events/create/private').set('Authorization', 'Bearer ' + eventUserBearer).send(createEventDto);
            expect(response.status).toBe(HttpStatus.CREATED)
        })
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

    describe('events likes', () => {
        it("should like an events from paris api and set to db", async() => {
            const response = await request(httpServer).post("/events/paris/like").set('Authorization', 'Bearer '+eventUserBearer).send({id: "test"})
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            expect(u.parisLike.length).toBe(1)
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.message).toBe("Succesfully liked")
        })
    })

    describe('ticketing validation', () => {
        const eventDto = {
            name: "basket entre pote",
            address: "12 rue valmy",
            categories: ["basket"],
        }
        it ("should validate ticket", async() => {
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            const response = await request(httpServer).get('/events/validate/ticket?key=' + e.participents[0].key + '&user='+e.participents[0].user + '&event=' + e._id).set('Authorization', 'Bearer ' + adminUserBearer)
            const e_after = await dbConnection.collection('events').findOne({name: eventDto.name});
            expect(e_after.participents[0].registered).toBe(true)
            expect(response.status).toBe(HttpStatus.ACCEPTED)
            expect(response.body.message).toBe("User registered")
        })

        it ('should not validate the ticket (missing event id)', async() => {
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            const response = await request(httpServer).get('/events/validate/ticket?key=' + e.participents[0].key + '&user='+e.participents[0].user).set('Authorization', 'Bearer ' + adminUserBearer)
            expect(response.body.message).toBe('Missing either creatorId, key, userId or eventId')
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it ('should not validate the ticket (not the creator who\'s validating the ticket)', async() => {
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            const response = await request(httpServer).get('/events/validate/ticket?key=' + e.participents[0].key + '&user='+e.participents[0].user + '&event=' + e._id).set('Authorization', 'Bearer ' + eventUserBearer)
            expect(response.body.message).toBe('You are not the owner of this event')
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it ('should not validate the ticket (the user is not registered to the event)', async() => {
            await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            const response = await request(httpServer).get('/events/validate/ticket?key=' + "falsekey" + '&user='+"falseuserid" + '&event=' + e._id).set('Authorization', 'Bearer ' + adminUserBearer)
            expect(response.status).toBe(HttpStatus.NOT_FOUND)
            expect(response.body.message).toBe("Could not find this user ticket")  
        })

        it('should not validate the ticekt (user registered, but the key is not good)', async() => {
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            const response = await request(httpServer).get('/events/validate/ticket?key=' + "falsekey" + '&user='+e.participents[0].user + '&event=' + e._id).set('Authorization', 'Bearer ' + adminUserBearer)
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body.message).toBe("Ticket is not valid")
        })

        it ("should not validate the ticket (already been used)", async() => {
            const event = await request(httpServer).post('/events/create').set('Authorization', 'Bearer ' + adminUserBearer).send(eventDto)
            await request(httpServer).post('/event/add').set('Authorization', 'Bearer ' + eventUserBearer).send({events: [event.body.event._id]})
            const e = await dbConnection.collection('events').findOne({name: eventDto.name});
            await request(httpServer).get('/events/validate/ticket?key=' + e.participents[0].key + '&user='+e.participents[0].user + '&event=' + e._id).set('Authorization', 'Bearer ' + adminUserBearer)
            const response = await request(httpServer).get('/events/validate/ticket?key=' + e.participents[0].key + '&user='+e.participents[0].user + '&event=' + e._id).set('Authorization', 'Bearer ' + adminUserBearer)
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body.message).toBe("Ticket has already been used")
        })
    })
});
