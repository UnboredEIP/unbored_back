import { Controller, Post, Query, Headers, Body, Req, Res, UseGuards, HttpStatus, ValidationPipe, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh-auth.guard';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/register')
    @ApiTags('Authentication')
    @ApiOperation({summary: "Register an account"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async register(@Body(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true})) registerDto: RegisterDto, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.register(registerDto)
        res.status(response.statusCode)
        return response;
    }

    @Post('/register/pro')
    @ApiTags('Authentication')
    @ApiOperation({summary: "Register an account"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async registerPro(@Body(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true})) registerDto: RegisterDto, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.registerPro(registerDto)
        res.status(response.statusCode)
        return response
    }

    @Post('/login')
    @ApiTags('Authentication')
    @ApiOperation({summary: "Login an account"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async login(@Body(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true})) loginDto: LoginDto, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, token : string, refresh : string}> {
        const response = await this.authService.login(loginDto);
        res.status(response.statusCode)
        return response;
    }

    @UseGuards(RefreshGuard)
    @UseGuards(JwtGuard)
    @Post('/refresh')
    @ApiTags('Authentication')
    @ApiHeader({name: "refresh", required: true})
    @ApiOperation({summary: "Get a new token using refresh token"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async refresh(@Req() req, @Headers() head, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, token: string, refresh : string}> {
        const response = await this.authService.refresh(req.user, head.refresh)
        res.status(response.statusCode);
        return response;
    }

    @Post('/login/google')
    @ApiTags('Authentication')
    @ApiOperation({summary: "Login with google oauth (not working on swagger)"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async loginGoogle(@Body() body, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, token: string, refresh: string}> {
        const response = await this.authService.googleLogin(body?.googleTokenId);
        res.status(response.statusCode);
        return response;
    }

    @Post('/askreset')
    @ApiTags('Password Management')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: "string",
                },
            }
        }
    })
    @ApiOperation({summary: "Ask for email request to reset password"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async askResetPassword(@Body() Body, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.askResetPassword(Body?.email);
        res.status(response.statusCode);
        return response;
    }

    @Post('/reset')
    @ApiTags('Password Management')
    @ApiHeader({name: "id", required: true})
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                password: {
                    type: "string",
                }
            }
        }
    })
    @ApiOperation({summary: "Reset password using token on request email link"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async resetPassword(@Body() Body, @Query('id') id, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.resetPassword(id, Body?.password);
        res.status(response.statusCode);
        return response;
    }

    @Post('/otp')
    @ApiTags('Authentication')
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                email: {
                    type: "string",
                },
                username: {
                    type: "string",
                },
            }
        }
    })
    @ApiOperation({summary: "Send a OTP code by mail and check if the username and the email is used"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async otpGeneration(@Body() Body, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.otpGeneration(Body.email, Body.username);
        res.status(response.statusCode);
        return response;
    }

    @Post('/otp/verify')
    @ApiTags('Authentication')
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                email: {
                    type: "string",
                },
                otp: {
                    type: "string",
                },
            }
        }
    })
    @ApiOperation({summary: "check if the otp is the good one identified by email"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async otpVerification(@Body() Body, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.authService.verifyOtp(Body.email, Body.otp);
        res.status(response.statusCode);
        return response;
    }
}