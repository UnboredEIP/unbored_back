import { Test } from "@nestjs/testing";
import { DatabaseService } from "src/database/database.service";
import * as request from "supertest"
import { HttpStatus } from "@nestjs/common";
import { AuthModule } from "../auth.module";
import { DatabaseModule } from "src/database/database.module";
import { ConfigModule } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Connection, Mongoose, Types, Model } from "mongoose";
import { Gender, User } from "src/auth/schemas/user.schema";
import { JwtService } from "@nestjs/jwt";

const User1 = {
    username: "testusernameauth",
    email: "testemailauth@email.com",
    password: "password",
    gender: Gender.HOMME,
    birthdate: new Date ("2002-05-05"),
    preferences: ["basket", "foot"]
}

describe('AuthController', () => {
    let dbConnection: Connection;
    let httpServer: any;
    let app: any;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true}), AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@${process.env.URL}:27017/unboredAuthEnv`)],
            providers: [{provide: getModelToken(User.name), useValue: {}}]
        }).compile();

        app = await moduleRef.createNestApplication();
        await app.init();
        dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
        httpServer = await app.getHttpServer();
        await dbConnection.collection('users').deleteMany({});
    }, 10000)

    afterEach(async () => {
        await dbConnection.collection('users').deleteMany({});
    });

    afterAll(async () => {
        await dbConnection.collection('users').deleteMany({});
    })

    describe('registration', () => {
        it('should register an account', async() => {
            const response = await request(httpServer).post('/auth/register').send(User1)
            expect(response.body.message).toMatch('Succesfully created !');
            expect(response.status).toBe(HttpStatus.CREATED);
        })
        it('should not register an account (duplicate key)', async() => {
            await request(httpServer).post('/auth/register').send(User1)
            const response = await request(httpServer).post('/auth/register').send(User1)
            expect(response.body.message).toMatch("Duplicated key")
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })

        // otp
        it ('should create account with otp', async() => {
            const user = {
                _id: new Types.ObjectId(),
                email : "test@toto.fr",
                username: "test",
                otp: {value: 424242, createdAt: new Date()}
            }
            const userReq = {
                email : "test@toto.fr",
                username: "test",
                otp: "424242",
                password: "password",
                gender: Gender.HOMME,
                birthdate: new Date ("2002-05-05"),
                preferences: ["basket", "foot"]
            }

            await dbConnection.collection('users').insertOne(user);
            const response = await request(httpServer).post('/auth/register').send(userReq);
            expect(response.status).toBe(HttpStatus.CREATED);
        });

        it ('should not create account (wrong otp)', async() => {
            const user = {
                _id: new Types.ObjectId(),
                email : "test@toto.fr",
                username: "test",
                otp: {value: 424242, createdAt: new Date()}
            }
            const userReq = {
                email : "test@toto.fr",
                username: "test",
                otp: "232323",
                password: "password",
                gender: Gender.HOMME,
                birthdate: new Date ("2002-05-05"),
                preferences: ["basket", "foot"]
            }

            await dbConnection.collection('users').insertOne(user);
            const response = await request(httpServer).post('/auth/register').send(userReq);
            expect(response.status).toBe(HttpStatus.NOT_ACCEPTABLE);
        });
    })

    describe('registration (pro)', () => {
        it('should register an account', async() => {
            const response = await request(httpServer).post('/auth/register/pro').send(User1)
            expect(response.body.message).toMatch('Succesfully created !');
            expect(response.status).toBe(HttpStatus.CREATED);
        })
        it('should not register an account (duplicate key)', async() => {
            await request(httpServer).post('/auth/register/pro').send(User1)
            const response = await request(httpServer).post('/auth/register/pro').send(User1)
            expect(response.body.message).toMatch("Duplicated key")
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })
    })

    describe('reseting password', () => {
        // Ask reset
        const User1 = {
            username: "testusernameauth",
            email: "notexisting@email.notexists",
            password: "password",
            gender: Gender.HOMME,
            birthdate: new Date ("2002-05-05"),
            preferences: ["basket", "foot"]
        }
        it ('should send a mail', async() => {
            await request(httpServer).post('/auth/register').send(User1);
            const response = await request(httpServer).post('/auth/askReset').send({email: User1.email});
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })
        it ('not sending email', async() => {
            const response = await request(httpServer).post('/auth/askReset');
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
        it ('not existing user', async() => {
            const response = await request(httpServer).post('/auth/askReset').send({email: "test@noemail.fr"});
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })

        //Reset
        it ('should work', async() => {
            await request(httpServer).post('/auth/register').send(User1);
            const jwtService = new JwtService;
            const token = jwtService.sign({email: User1.email}, {expiresIn: '5min', secret: process.env.RESET_PASSWORD_SECRET});
            await dbConnection.collection('users').findOneAndUpdate({email: User1.email},  {$set: {"resetToken": token}});
            const response = await request(httpServer).post(`/auth/reset?id=${token}`).send({password: "fakepassword"});
            expect(response.status).toBe(HttpStatus.ACCEPTED);
        })

        it ('should not work (expired token)', async() => {
            await request(httpServer).post('/auth/register').send(User1);
            const jwtService = new JwtService;
            const token = jwtService.sign({email: User1.email}, {expiresIn: '0s', secret: process.env.RESET_PASSWORD_SECRET});
            await dbConnection.collection('users').findOneAndUpdate({email: User1.email},  {$set: {"resetToken": token}});
            const response = await request(httpServer).post(`/auth/reset?id=${token}`).send({password: "fakepassword"});
            expect(response.status).toBe(HttpStatus.NOT_ACCEPTABLE);
        })

        it ('should not work (already used token)', async() => {
            await request(httpServer).post('/auth/register').send(User1);
            const jwtService = new JwtService;
            const token = jwtService.sign({email: User1.email}, {expiresIn: '5min', secret: process.env.RESET_PASSWORD_SECRET});
            await dbConnection.collection('users').findOneAndUpdate({email: User1.email},  {$set: {"resetToken": token}});
            await request(httpServer).post(`/auth/reset?id=${token}`).send({password: "fakepassword"});
            const response = await request(httpServer).post(`/auth/reset?id=${token}`).send({password: "fakepassword"});
            expect(response.status).toBe(HttpStatus.FORBIDDEN);
        })


        it ('should not reset (no token)', async() => {
            const response = await request(httpServer).post('/auth/reset')
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        })
    })

    describe('otp', () => {
        it ('should send otp to mail', async() => {
            const response = await request(httpServer).post('/auth/otp').send({email: "noexistingemail@not.exists", username: "notexists"});
            expect(response.status).toBe(HttpStatus.ACCEPTED);
        })

        it ('should not work (no email)', async() => {
            const response = await request(httpServer).post('/auth/otp');
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        })

        it ('should not work (duplicate)', async() => {
            await request(httpServer).post('/auth/register').send(User1)
            const response = await request(httpServer).post('/auth/otp').send({email: User1.email, username: User1.username});
            expect(response.status).toBe(HttpStatus.CONFLICT);
        })

        it ('verify otp', async() => {
            const user = {
                _id: new Types.ObjectId(),
                email : "test@toto.fr",
                username: "test",
                otp: {value: 424242, createdAt: new Date()}
            }
            const userReq = {
                email : "test@toto.fr",
                username: "test",
                otp: "424242",
                password: "password",
                gender: Gender.HOMME,
                birthdate: new Date ("2002-05-05"),
                preferences: ["basket", "foot"]
            }

            await dbConnection.collection('users').insertOne(user);
            const response = await request(httpServer).post('/auth/otp/verify').send(userReq);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it ('no body', async() => {
            const response = await request(httpServer).post('/auth/otp/verify').send();
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it ('verify otp (wrong)', async() => {
            const user = {
                _id: new Types.ObjectId(),
                email : "test@toto.fr",
                username: "test",
                otp: {value: 424242, createdAt: new Date()}
            }
            const userReq = {
                email : "test@toto.fr",
                username: "test",
                otp: "424233",
                password: "password",
                gender: Gender.HOMME,
                birthdate: new Date ("2002-05-05"),
                preferences: ["basket", "foot"]
            }

            await dbConnection.collection('users').insertOne(user);
            const response = await request(httpServer).post('/auth/otp/verify').send(userReq);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    })

    describe('login', () => {
        const User1_badMail = {
            email: "not_existing@email.com",
            password: "password",
        }

        const User1_badPass = {
            email: "testemailauth@email.com",
            password: "badpassword",
        }

        beforeEach(async() => {
            await request(httpServer).post('/auth/register').send(User1)
        })

        it ('should login an account', async() => {
            const response = await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password})
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })

        it ('should not login me (invalid username)', async() => {
            const response = await request(httpServer).post('/auth/login').send(User1_badMail)
            expect(response.body.message).toMatch("Invalid credentials");
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it ('should not login me (invalid password)', async() => {
            const response = await request(httpServer).post('/auth/login').send(User1_badPass)
            expect(response.body.message).toMatch("Invalid credentials");
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })
    })

    describe('refresh token', () => {
        it ('should return me new token', async() => {
            await request(httpServer).post('/auth/register').send(User1);
            const myTokens = await request(httpServer).post('/auth/login').send({email: User1.email}).send({password: User1.password})
            const response = await request(httpServer).post('/auth/refresh').set('Authorization', 'Bearer ' + myTokens.body.token).set('refresh', myTokens.body.refresh)
            expect(response.status).toBe(HttpStatus.ACCEPTED)
        })
    })

    describe('oauth2 google', () => {
        it ('should not work (fake google token)', async() => {
            const tokenid = "fake"
            const response = await request(httpServer).post('/auth/login/google').send({googleTokenId: tokenid});
            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })
    })
})