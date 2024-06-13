import { Controller, Delete, Get, HttpStatus, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';

@Controller('friends')
export class FriendsController {
    constructor(private friendsService : FriendsService) {} 

    @UseGuards(JwtGuard)
    @Get('/')
    @ApiTags('Friends')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Show your friends"})
    async showFriend(@Req() req, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, friends: Object[]}> {
        const response = await this.friendsService.showFriends(req.user);
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Get('/invitations')
    @ApiTags('Friends')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Show your friends requests"})
    async showInvitation(@Req() req, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, invitations: Object[]}> {
        const response = await this.friendsService.showInvitation(req.user)
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/invite')
    @ApiTags('Friends')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Send a friend request with users id"})
    @ApiQuery({name: "user_id", required: true})
    async invite(@Query('user_id') id, @Req() req, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.friendsService.sendInvitation(id, req.user)
        res.status(response.statusCode);
        return response;
    }

    @UseGuards(JwtGuard)
    @Post('/accept')
    @ApiTags('Friends')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Accept a friend request with user id"})
    @ApiQuery({name: "user_id", required: true})
    async accept(@Query('user_id') id, @Req() req, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.friendsService.acceptInvitation(id, req.user);
        res.status(response.statusCode)
        return response;
    }

    @UseGuards(JwtGuard)
    @Delete('/delete')
    @ApiTags('Friends')
    @ApiSecurity('authentication')
    @ApiOperation({summary: "Delete a friend with user id"})
    @ApiQuery({name: "user_id", required: true})
    async delete(@Query('user_id') id, @Req() req, @Res(({ passthrough: true })) res) : Promise<{statusCode: HttpStatus, message: string}> {
        const response = await this.friendsService.deleteFriend(id, req.user);
        res.status(response.statusCode);
        return response;
    }
}
