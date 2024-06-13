import { BadRequestException, ConflictException, HttpStatus, Injectable, NotAcceptableException, UnauthorizedException} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role, User } from "./schemas/user.schema";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { OAuth2Client } from 'google-auth-library';
import { MailerService } from "@nestjs-modules/mailer";

const client = new OAuth2Client(process.env.GOOGLE_OAUTH2);

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        private jwtService: JwtService,
        private mailerService: MailerService,
    ) {}

    async register(registerDto: RegisterDto) : Promise<{statusCode: HttpStatus, message: string}> {
        const { username, email, password, description, gender, birthdate, preferences, otp } = registerDto
        const hash = await bcrypt.hash(password, 10)
        let existing = await this.userModel.find({$or: [{email: email}, {username: username}]})

        if (existing.length === 1 && existing[0].otp === undefined) {
            throw new ConflictException("Duplicated key");
        } else if (existing.length === 1 && existing[0].otp !== undefined) {
            if (existing[0].otp.value.toString() === otp) {
                await this.userModel.findOneAndDelete({email: email});
            } else {
                return {statusCode: HttpStatus.NOT_ACCEPTABLE, message: "Wrong otp"}
            }
        }
        await this.userModel.create({
            username,
            email: email.toLowerCase(),
            gender,
            role: Role.USER,
            birthdate,
            password: hash,
            description,
            preferences: preferences,
        })
        return {statusCode: HttpStatus.CREATED, message: "Succesfully created !"}
    }

    async registerPro(registerDto: RegisterDto) : Promise<{statusCode: HttpStatus, message: string}> {
        const { username, email, password, description, gender, birthdate, preferences } = registerDto
        const hash = await bcrypt.hash(password, 10)
        const existing = await this.userModel.find(
            {$or: [
                {email: email},
                {username: username},
            ]}
        );
        if (existing.length >= 1) {
            throw new ConflictException("Duplicated key")
        }
        await this.userModel.create({
            username,
            email: email.toLowerCase(),
            gender,
            role: Role.PRO,
            birthdate,
            password: hash,
            description,
            preferences: preferences,
        })
        return {statusCode: HttpStatus.CREATED, message: "Succesfully created !"}
    }

    async login(loginDto : LoginDto) : Promise<{statusCode: HttpStatus, token: string, refresh : string}> {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email: (email.toLowerCase()) });
        if (!user) {
            throw new UnauthorizedException("Invalid credentials")
        }
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            throw new UnauthorizedException("Invalid credentials")
        }
        const sign = await this.userModel.findOne({email: (email.toLowerCase())}).select('username email preferences profilePhoto role')
        const token = this.jwtService.sign({ users: sign }, {expiresIn: "30d", secret: process.env.JWT_TOKEN});
        const refreshToken = this.jwtService.sign({ users: sign }, {expiresIn: '90d', secret: process.env.JWT_REFRESH});
        return {statusCode: HttpStatus.ACCEPTED, token: token, refresh: refreshToken};
    }

    async refresh(user : User, actualRefresh: string) : Promise<{statusCode: HttpStatus, token: string, refresh : string}>{
        const sign = await this.userModel.findById(user.id).select('username email')
        return {statusCode: HttpStatus.ACCEPTED, token: this.jwtService.sign({ users: sign }, {expiresIn: "30d", secret: process.env.JWT_TOKEN}), refresh: actualRefresh}
    }

    async googleLogin(tokenId: string) : Promise<{statusCode: HttpStatus, token: string, refresh : string}> {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: [
                process.env.GOOGLE_AUDIENCE_TOKEN,
            ]
        });
        console.log("verified")
        const email = ticket.getPayload()?.email ?? '';
        const username = ticket.getPayload()?.name ?? '';
        if (!email || !username) {
            throw new ConflictException('Email or username could not be verified');
        }
        let user = await this.userModel.findOne({email: email});
        if (!user) {
            user = await this.userModel.create({
                username: email.split('@')[0],
                email: email,
                password: await bcrypt.hash(email+process.env.GOOGLE_PASSWORD_CREATION, 10),
                description: "",
                role: Role.USER,
            })
        }
        const sign = await this.userModel.findOne({email: (email.toLowerCase())}).select('username email preferences profilePhoto role')
        const token = this.jwtService.sign({ users: sign }, {expiresIn: "30d", secret: process.env.JWT_TOKEN});
        const refreshToken = this.jwtService.sign({ users: sign }, {expiresIn: '90d', secret: process.env.JWT_REFRESH});
        return {statusCode: HttpStatus.ACCEPTED, token: token ,refresh: refreshToken};
    }

    async askResetPassword(email: string) : Promise<{statusCode: HttpStatus, message: string}> {
        if (!email)
            throw new BadRequestException("Bad Requests")
        const userExists = await this.userModel.findOne({email: email})
        if (!userExists || (userExists.otp !== undefined)) {
            return {statusCode: HttpStatus.ACCEPTED, message: "If account exists mail will be sent"}
        }
        const token = this.jwtService.sign({email: email}, {expiresIn: '5min', secret: process.env.RESET_PASSWORD_SECRET});
        await this.userModel.findOneAndUpdate({email: email},  {"resetToken": token});
        const emailContent = {
            to: email,
            subject: "Mot de passe oublié",
            text: "",
            html: `
            <div>
                <a>Vous pouvez reinitialiser votre mot de passe en utilisant ce lien : <a href="https://${process.env.URLFRONT}/forgot-password?id=${token}"> Reinitialiser  </a></a>
            </div>`
        };
        await this.mailerService.sendMail(emailContent)
        return {statusCode: HttpStatus.ACCEPTED, message: "If account exists mail will be sent"}
    }

    async resetPassword(tokenId: string, password: string) : Promise<{statusCode: HttpStatus, message: string}> {
        const decodedToken = await this.jwtService.decode(tokenId)
        if (!tokenId || !decodedToken) {
            throw new BadRequestException("Bad Request");
        }
        const user = await this.userModel.findOne({email: decodedToken.email});
        try {
            await this.jwtService.verify(tokenId, { secret: process.env.RESET_PASSWORD_SECRET});
            await this.userModel.findOneAndUpdate({email: user.email}, {$set: {"resetToken": null}})
        } catch (error) {
            await this.userModel.findOneAndUpdate({email: decodedToken.email}, {$set: {"resetToken": null}})
            console.log(error);
            throw new NotAcceptableException("Expired"); 
        }
        if (!(user.resetToken !== undefined && user.resetToken === tokenId)) {
            return {statusCode: HttpStatus.FORBIDDEN, message: "Pasword already changed"}
        }
        const hash = await bcrypt.hash(password, 10)
        await this.userModel.findOneAndUpdate({email: decodedToken.email}, {password: hash})
        return {statusCode: HttpStatus.ACCEPTED, message: "Password Changed"}
    }

    async otpGeneration(email: string, username: string) : Promise<{statusCode: HttpStatus, message: string}> {
        if (!email || !username)
            throw new BadRequestException("Bad Request");
        const existing = await this.userModel.find(
            {$or: [
                {email: email}, {username: username}
            ]}
        );
        if (existing.length >= 1) {
            throw new ConflictException("Duplicated key")
        }
        const otp = 100000 + Math.floor(Math.random() * 900000);
        const date = new Date();
        const emailContent = {
            to: email,
            subject: "Code OTP",
            text: "",
            html: `
            <div>
                <a> Voici votre code : ${otp} </a></a>
            </div>`
        };
        await this.userModel.create({email: email.toLocaleLowerCase(), otp: {value: otp, createdAt: date}, username: username});
        await this.mailerService.sendMail(emailContent)
        return {statusCode: HttpStatus.ACCEPTED, message: "OTP send by mail"};
    }

    async verifyOtp(email: string, otp: string) : Promise<{statusCode: HttpStatus, message: string}> {
        const user = await this.userModel.findOne({email: email});
        if (!user || !email || !otp) {
            throw new BadRequestException("Bad request");
        } 
        if (!(user.otp.value.toString() === otp)) {
            return {statusCode: HttpStatus.BAD_REQUEST, message: "Wrong otp"}
        }
        return {statusCode: HttpStatus.OK, message: "Otp verified"}
    }
}