import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../chat/schemas/chat.schema';
import { User } from 'src/auth/schemas/user.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) 
        private messageModel: Model<Message>,
        @InjectModel(User.name)
        private userModel: Model<User>
    ) {}

    async createMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
        if (!Types.ObjectId.isValid(receiverId)) {
            throw new BadRequestException("Bad Request")
        }
        const recv = await this.userModel.findOne({_id: receiverId}); 
        if (senderId === receiverId)
            throw new BadRequestException("Receiver ID is the same as the Sender ID")
        if (!recv)
            throw new BadRequestException("Receiver ID not found")
        const newMessage = new this.messageModel({ senderId, receiverId, content });
        return newMessage.save();
    }

    async getConversation(userId1: string, userId2: string): Promise<Message[]> {
        return this.messageModel
        .find({
            $or: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 },
            ],
        })
        .sort({ createdAt: 1 })
        .exec();
    }
}
