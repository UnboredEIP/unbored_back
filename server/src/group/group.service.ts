import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "src/auth/schemas/user.schema";
import { Groups } from "../groups/schemas/group.schema";
import { HttpStatus } from "@nestjs/common";
import { Model } from "mongoose"
import { SendMessageDto } from "./dto/sendMessage.dto";

@Injectable()
export class GroupService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectModel(Groups.name)
        private groupModel: Model<Groups>,
    ){}

    async showGroups(user: User) : Promise<{statusCode: HttpStatus, groups: Object[]}> {
        return {statusCode: HttpStatus.OK, groups: user.groups}
    }

    async showInvitation(user: User) : Promise<{statusCode: HttpStatus, invitations: Object[]}> {
        return {statusCode: HttpStatus.OK, invitations: user.invitations.groups}
    }

    async acceptInvitation(user: User, groupId: string) : Promise<{statusCode: HttpStatus, message: string}> {
        const exists = user.invitations.groups.some((invitations) => invitations._id === groupId)
        if (!exists) {
            return {statusCode: HttpStatus.NOT_ACCEPTABLE, message: "user did not had an invitation from this group"};
        } else {
            const newGroup = {
                _id: groupId,
                joinedAt: new Date()
            }
            await this.groupModel.findByIdAndUpdate(groupId, {$addToSet: { members: user._id}});
            await this.userModel.findByIdAndUpdate(user._id, {$addToSet: { groups: newGroup }});
            await this.userModel.findByIdAndUpdate(user._id, {$pull: {"invitations.groups": {_id: groupId}}}, {new: true});
            const hehe = await this.userModel.findOne({_id: user.id});
            return {statusCode: HttpStatus.OK, message: "Successfully joined group !"}
        }
    }

    async deleteInvitation(user: User, groupId: string) : Promise <{statusCode: HttpStatus, message: string}> {
        const exists = user.invitations.groups.some((invitations) => invitations._id === groupId)
        if (!exists)
            return {statusCode: HttpStatus.NOT_ACCEPTABLE, message: "user did not had an invitation from this group"};
        else {
            await this.userModel.findByIdAndUpdate(user._id, {$pull: {"invitations.groups": {_id:  groupId}}});
            return {statusCode: HttpStatus.OK, message: "successsfully rejected invitation !"}
        }
    }

    async sendMessage(user: User, groupdId: string, sendMessageDto: SendMessageDto) : Promise<{statusCode: HttpStatus, message: string}> {
        const {message} = sendMessageDto;
        const group = await this.groupModel.findById(groupdId)
        if (!group)
            throw new NotFoundException("Group not found !")
        const exists = user.groups.some((groups) => groups._id === groupdId);
        if (!exists)
            throw new ConflictException("You are not able to send a message to this group !")
        const newMessage = {
            message: message,
            _id: user.id,
            sendAt: new Date
        }
        await this.groupModel.findByIdAndUpdate(groupdId, {$addToSet: {messages: newMessage}});
        return {statusCode: HttpStatus.OK, message: message + " has been posted !"};
    }

}