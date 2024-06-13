import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/createGroup.dto';
import { Groups } from 'src/groups/schemas/group.schema';

@Controller('groups')
export class GroupsController {
    constructor(private groupsService : GroupsService) {}

    @UseGuards(JwtGuard)
    @Get('/show')
    @ApiTags('Global Groups')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Show group with group id"})
    @ApiQuery({name: "group_id", required: true})
    async showGroupWithId(@Query('group_id') id, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; group: Object }> {
        const response = await this.groupsService.showGroupWithId(id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/create')
    @ApiTags('Global Groups')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Group creation"})
    async createGroup(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createGroupDto: CreateGroupDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; group: Groups }> {
        const response = await this.groupsService.createGroup(req.user, createGroupDto);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/invite')
    @ApiTags('Global Groups')
    @ApiSecurity('authentication')
    @ApiOperation({summary: 'Invite user in group with group id and user id'})
    @ApiQuery({name: "group_id", required: true})
    @ApiQuery({name: "user_id", required: true})
    async inviteInGroup(@Query('group_id') id, @Query('user_id') userId, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.groupsService.inviteInGroup(id, userId);
        res.status(response.statusCode);
        return response;
    }
}
