import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';
import { Groups } from 'src/groups/schemas/group.schema';
import { CreateGroupDto } from './dto/createGroup.dto';

@Injectable()
export class GroupsService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectModel(Groups.name)
        private groupModel: Model<Groups>,
    ){}

    async showGroupWithId(id: string) : Promise<{statusCode: HttpStatus, group: Object}> {
        const group = await this.groupModel.findById(id)
        if (!group)
            throw new NotFoundException("Group not found")
        return {statusCode: HttpStatus.OK, group: group};
    }

    async createGroup(user: User, createGroupDto : CreateGroupDto) : Promise<{statusCode: HttpStatus, group: Groups}> {
        const { name } = createGroupDto;
        try {
            const group = await this.groupModel.create({
                name,
                leader: user._id,
            })
            const newGroup = {
                _id: group._id,
                joinedAt: new Date()
            }
            await this.userModel.findOneAndUpdate({_id: user._id}, {$addToSet: {groups: newGroup}});
            return {statusCode: HttpStatus.CREATED, group: group}
        } catch(error) {
            if (error.code === 11000) {
                throw new ConflictException("Duplicated Key")
            }
        }
    }

    async inviteInGroup(groupId: string, userId: string) : Promise<{statusCode: HttpStatus, message: string}> {
        const group = await this.groupModel.findById(groupId);
        const user = await this.userModel.findById(userId)
        if (!group)
            throw new NotFoundException("Group not found")
        if (!user)
            throw new NotFoundException("could not find this user")
        const exists = user.invitations.groups.some((invitations) => invitations._id === groupId)
        const newInvitations = {
            _id: groupId,
            createdAt: new Date()
        }
        if (exists) {
            return {statusCode: HttpStatus.CONFLICT, message: "user already got an invitation !"}
        } else if (group.members.includes(userId) === true) {
            return {statusCode: HttpStatus.CONFLICT, message: "user already in this group !"}
        } else {
            await this.userModel.findOneAndUpdate({_id: userId}, {$addToSet: {"invitations.groups": newInvitations}});
            return {statusCode: HttpStatus.OK, message: "invitation successfully sended !"}
        }
    }
}
