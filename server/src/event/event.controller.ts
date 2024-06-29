import { HttpStatus, Controller, UseGuards, Post, Req, Res, Body, Get, Delete, Query, Put, UseInterceptors, UploadedFile, FileTypeValidator, ParseFilePipe, BadRequestException, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { AddEventDto } from './dto/AddEvent.dto';
import { RateEventDto } from './dto/RateEvent.Dto';
import { EventService } from './event.service';
import { Events } from 'src/events/schemas/events.schema';
import { RemoveEventRateDto } from './dto/DeleteEventRate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RemoveEventDto } from './dto/RemoveEvent.dto';

@Controller('event')
@ApiSecurity('authorization')
export class EventController {
    constructor(private eventService: EventService) {}

    @UseGuards(JwtGuard)
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'List Actual USERS event (subscribed)'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @Get('/')
    async showEvent(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; reservations: string[] }> {
        const response = await this.eventService.showEvent(req.user);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'List Actual USERS event (subscribed)'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @Get('/reservations')
    async showEventsFromUser(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; reservations: any[] }> {
        const response = await this.eventService.showEventsFromUser(req.user);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/add')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Add event to actual user'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async addEvent(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) addEventDto: AddEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; reservations: string[] }> {
        const response = await this.eventService.addEvent(req.user.id, addEventDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Delete('/delete')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'delete event from actual user'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async removeEvent(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) deleteEventDto: RemoveEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; reservations: string[] }> {
        const response = await this.eventService.removeEvent(req.user.id, deleteEventDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/rate')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Rate event by event Id'})
    @ApiQuery({name: "id", required: true})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async addUnboredEventRate(@Query('id') id, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) rateEventDto: RateEventDto, @Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; event: Events }> {
        const response = await this.eventService.addUnboredRateEvent(id, rateEventDto, req.user.id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Delete('/rate')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Delete rate from event'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async removeUnboredEventRate(@Req() req, @Body() removeEventRateDto: RemoveEventRateDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; rates: Object }> {
        const response = await this.eventService.deleteUnboredRate(req.user.id, removeEventRateDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/favorites/add')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Add event to favorites'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async addFavorties(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) addEventDto: AddEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.eventService.addFavorites(req.user.id, addEventDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Delete('/favorites/delete')
    @ApiTags('Users Event')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'delete event from favorites'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async removeFavorites(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) deleteEventDto: RemoveEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.eventService.removeFavorites(req.user.id, deleteEventDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/upload')
    @UseInterceptors(FileInterceptor('file', {dest: "./data/images"}))
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'upload image on event by event id'})
    @ApiQuery({name: "id", required: true})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async uploadUnboredImages(@Req() req, @Query('id') id, @UploadedFile(
        new ParseFilePipe({
            validators: [
                new FileTypeValidator({fileType: '.(png|jpg|jpeg)'})
            ]
        })
    , ) file: Express.Multer.File, @Res(({ passthrough: true })) res) {
        res.status(HttpStatus.OK)
        try {
            return await this.eventService.uploadUnboredImage(req.user.id, id, file)
        } catch(err) {
            const fs = require('fs');
            fs.unlinkSync(file.path);
            throw new BadRequestException("Bad request")
        }
    }
}
