import { Body, Controller, Delete, Get, HttpStatus, Post, Put, Query, Req, Res, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/createEvent.dto';
import { Events } from './schemas/events.schema';
import { EditEventDto } from './dto/editEvent.dto';
import { ProGuard } from 'src/guards/role.guard';
import { QueryEventsDto } from './dto/queryEvents.dto';

@Controller('events')
export class EventsController {
    constructor(private eventsService: EventsService) {}

    @UseGuards(JwtGuard)
    @Get('/lists')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: "List all events"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async listEvents(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; events: Object[] }> {
        const response = await this.eventsService.listAllEvent(req.user.id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/lists/all')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: "List all public events"})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async listPublicEvents(@Req() req, @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) query: QueryEventsDto,@Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; events: Object[]; total: number }> {
        const response = await this.eventsService.listAllPublicEvent(query);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/create/private')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Create Event'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async createPrivateEvent(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createEventDto: CreateEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; event: Events }> {
        const response = await this.eventsService.createUnboredPrivateEvent(req.user.id, createEventDto);
        res.status(response.statusCode);
        return response;
    }


    @UseGuards(JwtGuard, ProGuard)
    @Post('/create')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Create Event'})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async createEvent(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createEventDto: CreateEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; event: Events }> {
        const response = await this.eventsService.createUnboredEvent(req.user.id, createEventDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard, ProGuard)
    @Put('/delete/user')
    async deleteUserFromEvent(@Req() req, @Res({ passthrough: true }) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.eventsService.deleteUserFromEvent(req.user.id, req.body.eventId, req.body.userList);
        res.status(response.statusCode)
        return response;
    } 

    @UseGuards(JwtGuard)
    @Put('/edit')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Edit Event by Id (only for event creator)'})
    @ApiQuery({name: "id", required: true})
    @ApiConsumes('application/json')
    async editEvent(@Req() req, @Query('id') id, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) editEventDto: EditEventDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; event: Events }> {
        const response = await this.eventsService.editUnboredEvent(req.user.id, editEventDto, id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard, ProGuard)
    @Delete('/delete')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Delete Event by Id (only for event creator)'})
    @ApiQuery({name: "id", required: true})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async deleteEvent(@Req() req, @Query('id') id, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.eventsService.deleteUnboredEvent(req.user.id, id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/show')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: 'Show event by ID'})
    @ApiQuery({name: "id", required: true})
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    async showDetails(@Query('id') id, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; event: Events }> {
        const response = await this.eventsService.getEventById(id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard, ProGuard)
    @Get('/validate/ticket')
    @ApiTags('Global Events')
    @ApiSecurity('authorization')
    @ApiOperation({summary: "Validate a ticket"})
    async validateTicket(@Req() creator, @Query('key') key: string, @Query('user') userId: string, @Query('event') eventId: string, @Res({passthrough: true}) res) : Promise<{ statusCode: HttpStatus, message: string}> {
        const response = await this.eventsService.validateTicket(creator.user._id, key, userId, eventId);
        res.status(response.statusCode)
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/paris/like')
    async parisLike(@Req() req, @Body('id') id, @Res({ passthrough: true }) res) :  Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.eventsService.setLike(id, req.user);
        res.status(response.statusCode)
        return response;
    }
}
