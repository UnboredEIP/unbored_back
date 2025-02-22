import { AppModule } from "../../app.module"
import { Test } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { Connection, Mongoose, Types, Model } from "mongoose";
import * as request from "supertest"
import { Gender, Role, User } from "../../auth/schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { HttpStatus } from "@nestjs/common";
// import { EventModule } from "src/event/event.module";
import { ProfileModule } from "../profile.module";
import { AuthModule } from "../../auth/auth.module";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "@nestjs/config";
import * as fs from 'fs';
import * as path from 'path';

const User1 = {
    username: "testusername",
    email: "testemail@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"],
}

const User2 = {
    username: "testusername123",
    email: "testemail123@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

describe('ProfileController', () => {
    var dbConnection: Connection;
    var httpServer: any;
    var app: any;
    var bearerUser1: string;
    var bearerUser2: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), ProfileModule, AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@${process.env.URL}:27017/unboredProfileEnv`)],
            providers: [{provide: getModelToken(User.name), useValue: {}}]
        }).compile();

        app = await moduleRef.createNestApplication();
        await app.init();
        dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
        httpServer = await app.getHttpServer();
        await dbConnection.collection('users').deleteMany({});
    }, 10000)

    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
    }, 10000)


    beforeEach(async () => {
        await request(httpServer).post('/auth/register').send(User1)
        await request(httpServer).post('/auth/register').send(User2)
        const login = await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password})
        const login2 = await request(httpServer).post('/auth/login').send({email: User2.email}).send({password: User2.password})

        bearerUser1 = login.body.token
        bearerUser2 = login2.body.token
    }, 10000)

    afterEach(async () => {
        await dbConnection.collection('users').deleteMany({});
    }, 10000)

    describe('getAllUsers', () => {
        it ('should return all users', async () => {
            const response = await request(httpServer).get('/profile/all').set('Authorization', 'Bearer ' + bearerUser1)
            expect(response.status).toBe(200)
        })
    })
    
    describe('getUsers', () => {
        /* Route /profile */
        it ('should return user profile', async () => {
            const response = await request(httpServer).get('/profile').set('Authorization', 'Bearer ' + bearerUser1)
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ('should send me unauthorized', async () => {
            const response = await request(httpServer).get('/profile')
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        })
    })

    describe('get users profile', () => {
        /* get users profile by id */
        it ('should send me user 2 informations using user 1 bearer token', async() => {
            const iduser2 = await request(httpServer).get('/profile').set('Authorization', 'Bearer ' + bearerUser2);
            const response = await request(httpServer).get('/profile?id='+iduser2.body.user._id).set('Authorization', 'Bearer ' + bearerUser2)
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ('should return me an error (invalid id)', async() => {
            const response = await request(httpServer).post('/profile?id='+"badId").set('Authorization', 'Bearer ' + bearerUser2)
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        })

        it ('should return me profile by id', async() => {
            const iduser2 = await request(httpServer).get('/profile').set('Authorization', 'Bearer ' + bearerUser2);
            const response = await request(httpServer).get('/profile/get?id='+iduser2.body.user._id).set('Authorization', 'Bearer ' + bearerUser2)
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ('should return me an error (false id)', async() => {
            const response = await request(httpServer).get('/profile/get?id='+"falseid").set('Authorization', 'Bearer ' + bearerUser2)
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.body.message).toBe("Invalid Id");
        })        
    })

    describe('update users profile', () => {
        /* Update user */
        const updateDto = {
            preferences: ["ping-pong", "jeu-video"]
        };
        const badUpdateDto = {
            username: "testusername123",
            email: "testemail123@email.com"
        }
        it ('should update user1 information', async() => {
            const response = await request(httpServer).put('/profile/update').set('Authorization', 'Bearer ' + bearerUser1).send(updateDto);
            const userprofile = await request(httpServer).get('/profile').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK);
            expect(userprofile.body.user.preferences).toMatchObject(updateDto.preferences);
        })

        it ('should return me an error (already used email/username)', async() => {
            const response = await request(httpServer).put('/profile/update').set('Authorization', 'Bearer ' + bearerUser1).send(badUpdateDto);
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })

        it ('should return me an error (invalid id)', async() => {
            const response = await request(httpServer).put('/profile/update').send(updateDto);
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        })

        it ('should return me an error (trying to change role)', async() => {
            const updateDto = {
                role: "caca"
            }
            const response = await request(httpServer).put('/profile/update').set('Authorization', 'Bearer ' + bearerUser1).send(updateDto);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        })

        it ('should change my password', async() => {
            const updateDto = {
                password: "test"
            }
            const response = await request(httpServer).put('/profile/update').set('Authorization', 'Bearer ' + bearerUser1).send(updateDto);
            const login = await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: "test"})
            expect(login.body.hasOwnProperty('refresh')).toBe(true)
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ('should upload my profile picture', async() => {
            const testImagePath = path.join(__dirname, 'test.png');
            const response = await request(httpServer).post('/profile/profilepicture').set('Authorization', 'Bearer ' + bearerUser1).attach('file', testImagePath);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.message).toBe("Image uploaded !");
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            const uploadedImagePath = path.join('./data/images', u.profilePhoto);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
            }
        })

        it ('should change my profile picture', async() => {
            const testImagePath = path.join(__dirname, 'test.png');
            await request(httpServer).post('/profile/profilepicture').set('Authorization', 'Bearer ' + bearerUser1).attach('file', testImagePath);
            const response = await request(httpServer).post('/profile/profilepicture').set('Authorization', 'Bearer ' + bearerUser1).attach('file', testImagePath);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.message).toBe("Image uploaded !");
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            const uploadedImagePath = path.join('./data/images', u.profilePhoto);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
            }
        })
    })

    describe('user avatar', () => {
        /* Avatar */
        it ("should return me user avatar", async() => {
            const response = await request(httpServer).get('/profile/avatar').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK);
        })
        it ('should return me an error (no bearer token)', async() => {
            const response = await request(httpServer).get('/profile/avatar');
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        /* Avatars */

        it ("should return me user unlocked avatar", async() => {
            const response = await request(httpServer).get('/profile/avatars').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK);
        })
        it ('should return me an error (no bearer token)', async() => {
            const response = await request(httpServer).get('/profile/avatars');
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        /* Update avatar */
        it ('should return me new avatar', async() => {
            interface AvatarPart {
                id?: string;
                color?: string;
            }
            const updateavatardto: { head: AvatarPart; eyebrows: AvatarPart; hair: AvatarPart; eyes: AvatarPart; mouth: AvatarPart; beard: AvatarPart; accessory: AvatarPart; clothes: AvatarPart; } = 
                { head: { id: "1", color: "red" },
                eyebrows: { id: "2", color: "blue" },
                hair: { id: "3", color: "red" },
                eyes: { id: "4", color: "blue" },
                mouth: { id: "5", color: "pink" },
                beard: { id: "6", color: "purple" },
                accessory: { id: "7" },
                clothes: { color: "brown" } }
            const response = await request(httpServer).post('/profile/avatar').set('Authorization', 'Bearer ' + bearerUser1).send(updateavatardto);
            const u = await dbConnection.collection('users').findOne({email: User1.email})
            updateavatardto.clothes.id = "0";
            updateavatardto.accessory.color = "0";
            expect(updateavatardto).toEqual(u.style)
            expect(response.status).toBe(HttpStatus.OK);
        })

        it ('should return me an error (no bearer token)', async() => {
            const updateavatardto = {
                style: {
                    head: "1",
                    body: "2",
                    pants: "2",
                    shoes: "1",
                }
            }
            const response = await request(httpServer).post('/profile/avatar').send(updateavatardto);
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        })

        it ("should buy me new avatar", async() => {
            await dbConnection.collection('users').findOneAndUpdate({email: User1.email}, {$set: {coins: 1000}});
            const response = await request(httpServer).post('/profile/avatar/buy').set('Authorization', 'Bearer '+ bearerUser1).send({unlock: "avatar1", coins: 400});
            const u = await dbConnection.collection('users').findOne({email: User1.email});
            expect(response.status).toBe(HttpStatus.OK)
            expect(u.coins).toBe(600)
            expect(u.unlockedStyle.includes("avatar1")).toBe(true)
        })

        it ("should not buy avatar (not enough coins)", async() => {
            const response = await request(httpServer).post('/profile/avatar/buy').set('Authorization', 'Bearer '+ bearerUser1).send({unlock: "avatar1", coins: 400});
            const u = await dbConnection.collection('users').findOne({email: User1.email});
            expect(response.status).toBe(HttpStatus.NOT_ACCEPTABLE)
            expect(u.coins).toBe(0)
            expect(response.body.message).toBe('Not enough coins !');
        })

        it ("should not buy me new avatar (already unlocked)", async() => {
            await dbConnection.collection('users').findOneAndUpdate({email: User1.email}, {$set: {coins: 1000}});
            await request(httpServer).post('/profile/avatar/buy').set('Authorization', 'Bearer '+ bearerUser1).send({unlock: "avatar1", coins: 400});
            const response = await request(httpServer).post('/profile/avatar/buy').set('Authorization', 'Bearer '+ bearerUser1).send({unlock: "avatar1", coins: 400});
            const u = await dbConnection.collection('users').findOne({email: User1.email});
            expect(response.status).toBe(HttpStatus.NOT_ACCEPTABLE)
            expect(u.coins).toBe(600)
            expect(u.unlockedStyle.length).toBe(1)
            expect(response.body.message).toBe('Already unlocked avatar !')
        })
    })

    describe('user filters', () => {
        const User1 = {
            username: "IdrissaFall",
            email: "randomemail@email.com",
            password: "password",
            gender: Gender.HOMME,
            birthdate: new Date ("2002-05-05"),
            preferences: ["basket", "foot"],
        }
        
        const User2 = {
            username: "RemiSaleh",
            email: "randomemail123@email.com",
            password: "password",
            gender: Gender.HOMME,
            birthdate: new Date ("2002-05-05"),
            preferences: ["basket", "foot"]
        }
        beforeEach(async () => {
            await request(httpServer).post('/auth/register').send(User1)
            await request(httpServer).post('/auth/register').send(User2)    
            const login = await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password})
            const login2 = await request(httpServer).post('/auth/login').send({email: User2.email}).send({password: User2.password})
    
            bearerUser1 = login.body.token
            bearerUser2 = login2.body.token
        }, 10000);
        it ('should return me all users', async() => {
            const response = await request(httpServer).get('/profile/all').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.users.length).toBe(4);
        })
        it ('should return me user1 information', async() => {
            const response = await request(httpServer).get('/profile/all?username=Idriss').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.users.length).toBe(1);
            expect(response.body.users[0].username).toBe(User1.username)
        })
        it ('should return me user2 information', async() => {
            const response = await request(httpServer).get('/profile/all?username=RemiSa').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.users.length).toBe(1);
            expect(response.body.users[0].username).toBe(User2.username)
        })

        it ('should return me user1 and user2 information', async() => {
            const response = await request(httpServer).get('/profile/all?email=randomemai').set('Authorization', 'Bearer ' + bearerUser1);
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.users.length).toBe(2);
        })
    })
})