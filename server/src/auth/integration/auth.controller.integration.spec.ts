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
            imports: [ConfigModule.forRoot({ isGlobal: true}), AuthModule, DatabaseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@localhost:27017/unboredAuthEnv`)],
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

    // describe('google oauth2 login/register', () => {
    //     it ("should create me a user", async() => {
    //         const response = await request(httpServer).post('/auth/login/google')
    //         .send({googleTokenId: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwMWY1NmU0MWNmMzVjOTkyNmRlODRhMmQ1NTJiNGM2ZjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTM0NTc1ODI5NzM3LXVrbWVjZzQ3a3AxMGZwZzIwcG81Ym81aDZrNnIzMHVvLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTM0NTc1ODI5NzM3LXVrbWVjZzQ3a3AxMGZwZzIwcG81Ym81aDZrNnIzMHVvLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAyMDIyNzAxMzA3MzcyMjg0NTgxIiwiZW1haWwiOiJqaW1heXh1MTIzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoicWxqcklmX1BBSWppV3hRaUlTa2lfZyIsIm5iZiI6MTY5NTk4MzEzNSwibmFtZSI6IkppbWF5IFh1IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tQN05NRTJVNXFDVnctbmFXaThYZy1MbGgtdTdkSjRXZjMtME0wS3lTdXhBPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkppbWF5IiwiZmFtaWx5X25hbWUiOiJYdSIsImxvY2FsZSI6ImZyIiwiaWF0IjoxNjk1OTgzNDM1LCJleHAiOjE2OTU5ODcwMzUsImp0aSI6Ijg0YTViYzFjZTEzNTc4Yzg3ODQ1ZTYwNWFiYTI0ODUyMTE5MTI0NTUifQ.EXbDosWreCTkw6VnpajFh1idnfdZ1LGAhqus8Up_eZGFQ1T_qjSHvg_xvaoaFRMfpzaE-fku7Bf1Uj-G5Ol8qmK-RhNX4-jtm1-sSaViyYDJvDXxT4kcXl5XuSpUr7_gtFK2SPkTpjpK-61XzNv1W-nszBVtRLnx3drPS0u2WvhZpe0O81rwWPllMiTHo9ToaQiL-JK8lSrpzeIS4_v_tr4hLjT9BuLisfguhMK-WrRR1gnD71QqyrE5K1XmIktXZF3mhcGOqDQn-mbY9e0XSj2vrFZNtVpPQAUaeExiXKeLD-DWemtqYKkCeXu0K-E0y4Tbyxi2TC3Dp0TYyuC2zw"})
    //         expect(response.body.status).toBe(HttpStatus.ACCEPTED);
    //     })
    // })
})