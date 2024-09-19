import { Controller, Post, Body, Get, Param, UseGuards, Req, Res, Query, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.services';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @UseGuards(JwtGuard)
    @Post('message')
    async sendMessage(@Req() req, @Res({passthrough: true}) res, @Body() body: {receiverId: string, content: string }) {
        return this.chatService.createMessage(req.user.id, body.receiverId, body.content);
    } 

    @Get('conversation')
    async getConversation(@Query('id1') userId1, @Query('id2') userId2) {
        return this.chatService.getConversation(userId1, userId2);
    }

    @Post('notification')
    async getNotification(@Req() req) {
        return this.chatService.getNotification(req.user.id);
    }

    @Post('delete/notification')
    async deleteNotification(@Req() req, @Body() body: {number: number}) {
        return this.chatService.deleteNotification(req.user.id, body.number);
    }
}
