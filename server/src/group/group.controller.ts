import { Controller, Get, UseGuards, Req, HttpStatus, Post, Body, Query, Delete, ValidationPipe, Res } from "@nestjs/common";
import { JwtGuard } from "src/auth/guards/jwt-auth.guard";
import { SendMessageDto } from "./dto/sendMessage.dto";
import { GroupService } from "./group.service";
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from "@nestjs/swagger";

@Controller('group')
export class GroupController {
    constructor(private groupService : GroupService) {}

    @UseGuards(JwtGuard)
    @Get('/')
    @ApiTags('Users Group')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Show current user groups"})
    async showGroups(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; groups: Object[] }> {
        const response = await this.groupService.showGroups(req.user);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/invitations')
    @ApiTags('Users Group')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Show current user group invitations"})
    async showInvitation(@Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; invitations: Object[] }> {
        const response = await this.groupService.showInvitation(req.user);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/accept')
    @ApiTags('Users Group')
    @ApiSecurity('authentication')
    @ApiOperation({summary: 'Accept group invitation with group id'})
    @ApiQuery({name: "group_id", required: true})
    async acceptInvitation(@Query('group_id') id, @Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.groupService.acceptInvitation(req.user, id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Delete('/delete')
    @ApiTags('Users Group')
    @ApiSecurity('authentication')
    @ApiOperation({summary: 'Delete group invitation with group id'})
    @ApiQuery({name: "group_id", required: true})
    async deleteInvitation(@Query('group_id') id, @Req() req, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.groupService.deleteInvitation(req.user, id);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/message')
    @ApiTags('Users Group')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Send message in a group with group id"})
    @ApiQuery({name: "group_id", required: true})
    async sendMessage(@Query('group_id') id, @Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) sendMessageDto: SendMessageDto, @Res({ passthrough: true }) res): Promise<{ statusCode: HttpStatus; message: string }> {
        const response = await this.groupService.sendMessage(req.user, id, sendMessageDto);
        res.status(response.statusCode);
        return response;
    }
}