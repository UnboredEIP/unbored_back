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
import { GroupModule } from "../group.module";
import { GroupsModule } from "../../groups/groups.module";


const User1 = {
    username: "testusernameevent",
    email: "testemailevent@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

const User2 = {
    username: "testusername123",
    email: "testemail123@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

describe('EventController', () => {
    let dbConnection: Connection;
    let httpServer: any;
    let app: any;
    let groupUserBearer: string;
    let groupUser2Bearer: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), GroupModule, GroupsModule, AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@localhost:27017/unboredGroupEnv`)],
            providers: [{provide: getModelToken(User.name), useValue: {}}]
        }).compile();

        app = await moduleRef.createNestApplication();
        await app.init();
        dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
        httpServer = await app.getHttpServer();
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('groups').deleteMany({});
    }, 10000)

    beforeEach(async () => {
        await request(httpServer).post('/auth/register/pro').send(User1)
        await request(httpServer).post('/auth/register').send(User2)

        const login = (await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password}))
        const login1 = (await request(httpServer).post('/auth/login').send({email: User2.email}).send({password: User2.password}))
        groupUserBearer = login.body.token;
        groupUser2Bearer = login1.body.token;
    }, 10000);

    afterEach(async () => {
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('groups').deleteMany({});
    }, 10000)

    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
        await dbConnection.collection('groups').deleteMany({});
    }, 10000)

    describe('user groups', () => {
        it("should return all groups", async() => {
            const response = await request(httpServer).get('/group').set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.status).toBe(HttpStatus.OK)
        });

        it("should create a group", async() => {
            const response = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            expect(response.status).toBe(HttpStatus.CREATED)
        });

        it ("should not create a group (conflit)", async() => {
            await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const response = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            expect(response.status).toBe(HttpStatus.CONFLICT)
        })
    })

    describe('show groups', () => {
        it("should return groups informations", async() => {
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id
            const response = await request(httpServer).get('/groups/show?group_id='+groupId).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.OK)
        })
        it("should not return groups informations (bad id)", async() => {
            const badGroupId = new Types.ObjectId();
            const response = await request(httpServer).get('/groups/show?group_id='+badGroupId).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_FOUND)
        })
    })

    describe('show groups invitation', () => {
        it("should return users groups invitations", async() => {
            const response = await request(httpServer).get('/group/invitations').set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.OK);
        })
    })

    describe('invitation in groups', () => {
        it("should invite user 2 in groups", async() => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            const response = await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.OK)
            expect(response.body.message).toMatch("invitation successfully sended !");
        })

        it("should not invite user 2 in groups (invitation duplication) ", async() => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            const response = await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.CONFLICT)
            expect(response.body.message).toMatch("user already got an invitation !");
        })

        it("should not invite user 2 in groups (bad group id)", async() => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const badGroupId = new Types.ObjectId();
            const response = await request(httpServer).post('/groups/invite?group_id='+badGroupId._id+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_FOUND)
            expect(response.body.message).toMatch("Group not found");
        })

        it("should not invite user 2 in groups (bad user id) ", async() => {
            const badUserId = new Types.ObjectId();
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            const response = await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+badUserId._id).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_FOUND)
            expect(response.body.message).toMatch("could not find this user");
        })

        it("should not invite user 2 in groups (user already in group)", async() => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            await request(httpServer).post('/group/accept?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)
            const response = await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            expect(response.body.statusCode).toBe(HttpStatus.CONFLICT)
            expect(response.body.message).toMatch("user already in this group !")
        })
    })

    describe('invations acceptations', () => {
        it ("should accept an invitations from a group", async()  => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            const response = await request(httpServer).post('/group/accept?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)
            expect(response.body.statusCode).toBe(HttpStatus.OK)
            expect(response.body.message).toMatch("Successfully joined group !")
        })
        it ("should not accept an invitations from a group (no invitations)", async()  => {
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            const response = await request(httpServer).post('/group/accept?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_ACCEPTABLE)
            expect(response.body.message).toMatch("user did not had an invitation from this group")
        })
    })

    describe('delete invitations', () => {
        it ("should delete an invitations from a group", async()  => {
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            const response = await request(httpServer).delete('/group/delete?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)
            expect(response.body.statusCode).toBe(HttpStatus.OK)
            expect(response.body.message).toMatch("successsfully rejected invitation !")
        })
        it ("should not delete an invitations from a group (no invitations)", async()  => {
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            const response = await request(httpServer).delete('/group/delete?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_ACCEPTABLE)
            expect(response.body.message).toMatch("user did not had an invitation from this group")
        })
    })

    describe('send message to a group', () => {
        const messageDto = {
            message: "Hello world"
        }
        it("should send a messaage to a group", async() => {
            /* user 2 join group */
            const user2Id = (await dbConnection.collection('users').findOne({username: User2.username}))._id
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;
            await request(httpServer).post('/groups/invite?group_id='+groupId+'&'+'user_id='+user2Id).set('Authorization', 'Bearer ' + groupUserBearer)
            await request(httpServer).post('/group/accept?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer)

            const response = await request(httpServer).post('/group/message?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer).send(messageDto)
            expect(response.body.statusCode).toBe(HttpStatus.OK)
            expect(response.body.message).toMatch(messageDto.message+ " has been posted !");
        })

        it("should not send a messaage to a group (not in group)", async() => {
            /* user 2 join group */
            const group = await request(httpServer).post('/groups/create').set('Authorization', 'Bearer ' + groupUserBearer).send({name: "heelo"})
            const groupId = group.body.group._id;

            const response = await request(httpServer).post('/group/message?group_id='+groupId).set('Authorization', 'Bearer ' + groupUser2Bearer).send(messageDto)
            expect(response.body.statusCode).toBe(HttpStatus.CONFLICT)
            expect(response.body.message).toMatch("You are not able to send a message to this group !");
        })

        it("should not send a message to a group (group not existing)", async() => {
            const badUserId = new Types.ObjectId();
            const response = await request(httpServer).post('/group/message?group_id='+badUserId).set('Authorization', 'Bearer ' + groupUser2Bearer).send(messageDto)
            expect(response.body.statusCode).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toMatch("Group not found !")
        })
    })
})