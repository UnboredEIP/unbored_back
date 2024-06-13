import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';

@Injectable()
export class FriendsService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
    ){}

    async showFriends(user: User) : Promise<{statusCode: HttpStatus, friends: Object[]}> {
        return {statusCode: HttpStatus.OK, friends: user.friends};
    }

    async showInvitation(user: User) : Promise<{statusCode: HttpStatus, invitations: Object[]}> {
        return {statusCode: HttpStatus.OK, invitations: user.invitations.friends}
    }

    async sendInvitation(id: string, user: User) : Promise<{statusCode: HttpStatus, message: string}> {
        if (user._id.toString() === id || isValidObjectId(id) === false) {
            throw new BadRequestException("Bad request")
        }
        const user1 = await this.userModel.findById(id)
        if (!user1)
            throw new NotFoundException("could not find this user")

        const exists = user1.invitations.friends.some((invitations) => invitations._id.toString() === user._id.toString())
        const newInvitations = {
            _id: user._id,
            createdAt: new Date()
        }
        if (exists) {
            return {statusCode: HttpStatus.CONFLICT, message: "user already got an invitation !"}
        } else if (user1.friends.includes(user._id) === true) {
            return {statusCode: HttpStatus.CONFLICT, message: "user is already your friend !"}
        } else {
            await this.userModel.findOneAndUpdate({_id: id}, {$addToSet: {"invitations.friends": newInvitations}});
            return {statusCode: HttpStatus.OK, message: "invitation successfully sended !"}
        }
    }

    async acceptInvitation(id: string, user: User) : Promise<{statusCode: HttpStatus, message: string}> {
        let invitation : object;
        const exists = user.invitations.friends.some((invitations) => {
            if (invitations._id.toString() === id) {
                invitation = invitations;
                return true;
            }
        })
        if (!exists)
            throw new BadRequestException("Bad request");
        await this.userModel.findOneAndUpdate({_id: user.id}, {$pull: {"invitations.friends": invitation}});
        await this.userModel.findOneAndUpdate({_id: user.id}, {$addToSet: {"friends": {_id: id}}});
        await this.userModel.findOneAndUpdate({_id: id}, {$addToSet: {"friends": {_id: user.id}}});
        return {statusCode: HttpStatus.ACCEPTED, message: "Friend request accepted"};
    }

    async deleteFriend(id: string, user: User) : Promise<{statusCode: HttpStatus, message: string}> {
        const exists = user.friends.some((a) => a._id === id);
        if (!exists)
            throw new BadRequestException("Bad requests")
        await this.userModel.findOneAndUpdate({_id: user.id}, {$pull: {"friends": {_id: id}}});
        await this.userModel.findOneAndUpdate({_id: id}, {$pull: {"friends": {_id: user._id.toString()}}});
        return {statusCode: HttpStatus.ACCEPTED, message: "Friend successfully deleted"};
    }
}
