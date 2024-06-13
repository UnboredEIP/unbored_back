import { Controller, Get, UseGuards, Req, Put, Body, Post, Query, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, Res, BadRequestException, ValidationPipe, HttpStatus } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDto } from './dto/update.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { ProfileService } from './profile.service';
import { User } from 'src/auth/schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryUsersDto } from './dto/queryUsers.dto';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';

@Controller('profile')
export class ProfileController {

    constructor(private profileService: ProfileService) {}

    @UseGuards(JwtGuard)
    @Get('/all')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Get all users, can add options to get specifics users"})
    @ApiQuery({name: "username", required: false})
    @ApiQuery({name: "email", required: false})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async getAll(@Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) query: QueryUsersDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; users: User[] }> {
        const response = await this.profileService.getAll(query);
        res.status(HttpStatus.OK);
        return response;
    }    

    @UseGuards(JwtGuard)
    @Get('/')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Get current user informations"})
    async profile(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; user: User }> {
        const response = await this.profileService.profile(req.user);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/')
    @ApiSecurity('authorization')
    @ApiHeader({name: "id", required: true})
    @ApiOperation({summary: "Get user informations by id"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiTags('Profile')
    async getprofilebyid(@Query('id') id, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; user: User }> {
        const response = await this.profileService.getprofilebyid(id);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @Put('/update')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Update current user informations"})
    @ApiConsumes('application/json')
    async update(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateUser: UpdateDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; user: User }> {
        const response = await this.profileService.UpdateUser(req.user.id, updateUser);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/avatar')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Get current user avatar informations"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async avatar(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; style: Object }> {
        const response = await this.profileService.UserActualAvatar(req.user);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/avatars')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Get current user unlocked avatar informations"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async avatars(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; unlockedStyles: Object }> {
        const response = await this.profileService.UserAvatars(req.user);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/avatar')
    @ApiSecurity('authorization')
    @ApiTags('Profile')
    @ApiOperation({summary: "Update current avatar informations"})
    @ApiConsumes('application/json')
    async changeAvatar(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateAvatarDto: UpdateAvatarDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; style: Object }> {
        const response = await this.profileService.ChangeAvatar(req.user.id, updateAvatarDto);
        res.status(HttpStatus.OK);
        return response;
    }

    @UseGuards(JwtGuard)
    @ApiSecurity('authorization')
    @Post('/profilepicture')
    @ApiTags('Profile')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file', {dest: "./data/images"}))
    @ApiOperation({summary: "Update current profile photo"})
    @ApiConsumes('application/x-www-form-urlencoded')
    async uploadUnboredImages(@Req() req, @UploadedFile(
        new ParseFilePipe({
            validators: [
                new FileTypeValidator({fileType: '.(png|jpg|jpeg)'})
            ]
        })
    , ) file: Express.Multer.File, @Res(({ passthrough: true })) res) {
        res.status(HttpStatus.OK)
        try {
            if (req.user.profilePhoto) {
                const imagePath = `./data/images/${req.user.profilePhoto}`;
                const fs = require('fs');
                await fs.unlinkSync(imagePath);
            }
            return await this.profileService.uploadProfilePicture(req.user.id, file);
        } catch(err) {
            const fs = require('fs');
            fs.unlinkSync(file.path);
            throw new BadRequestException("Bad request")
        }
    }
}
