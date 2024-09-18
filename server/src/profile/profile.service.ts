import { BadRequestException, ConflictException, HttpStatus, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../auth/schemas/user.schema";
import { UpdateDto } from './dto/update.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { QueryUsersDto } from './dto/queryUsers.dto';
import * as bcrypt from 'bcryptjs'

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
    ){}

    async getAll(query: QueryUsersDto) : Promise <{statusCode: HttpStatus, users: User[]}> {
        const queries = {};
        Object.keys(query).forEach(key => {
            if (key === "email" || key === "username")
                queries[key] = {$regex: query[key], $options: "i"};
        });
        // Correspondance complete : 
        const allUsers = await this.userModel.find(queries).select('-password').select('-__v');
        // Correspondance partiel : 
        // const allUsers = await this.userModel.find({
        //     $or: Object.keys(options).map(key => ({
        //         [key]: {$regex: options[key], $options: "i"}
        //     }))
        // }).select('-password').select('-__v');
        return {statusCode: HttpStatus.OK, users: allUsers};
    }

    async profile(user : User) : Promise <{statusCode: HttpStatus, user: User}>{
        return {statusCode: HttpStatus.OK, user: user};
    }

    async getprofilebyid(profilId: string) : Promise <{statusCode: HttpStatus, user: User}>{
        if (!Types.ObjectId.isValid(profilId))
            throw new NotFoundException('Invalid Id');
        const getUser = await this.userModel.findById(profilId).select('-password').select('-__v');
        return {statusCode: HttpStatus.OK, user : getUser as User};
    }

    async UpdateUser(id: string, updateUser : UpdateDto) : Promise<{statusCode: HttpStatus, user: User}> {
        try {
            if (updateUser.password) {
                updateUser.password = await bcrypt.hash(updateUser.password, 10);
            }
            let updatedUser = await this.userModel.findByIdAndUpdate(id, updateUser, {new: true}).select('-password').select('-__v');
            return {statusCode: HttpStatus.OK, user: updatedUser as User};
        } catch(error) {
            if (error.code === 11000) {
                throw new ConflictException('Already used key');
            }
        }
    }

    async UserActualAvatar(user : User) : Promise<{statusCode: HttpStatus, style: Object}> {
        return {statusCode: HttpStatus.OK, style: user.style as Object} ;
    }

    async UserAvatars(user : User) : Promise<{statusCode: HttpStatus, unlockedStyles: Object}>{
        return {statusCode: HttpStatus.OK, unlockedStyles: user.unlockedStyle}
    }

    async ChangeAvatar(id: string, updateAvatarDto : UpdateAvatarDto) : Promise<{statusCode: HttpStatus, style: Object}> {
        const updateQuery = {
            $set: {}
        };
        
        const currentUser = await this.userModel.findById(id);
        Object.keys(updateAvatarDto).forEach((key) => {
            if (updateAvatarDto[key] !== undefined) {
                updateAvatarDto[key].color = updateAvatarDto[key].hasOwnProperty("color") === false ? currentUser.style[key].color : updateAvatarDto[key].color;
                updateAvatarDto[key].id = updateAvatarDto[key].hasOwnProperty("id") === false ? currentUser.style[key].id : updateAvatarDto[key].id;
                updateQuery.$set[`style.${key}`] = updateAvatarDto[key];
            }
        });
    
        const avatarUpdate = await this.userModel.findByIdAndUpdate(id, updateQuery, { new: true });
    
        return { statusCode: HttpStatus.OK, style: avatarUpdate.style };

    }

    async uploadProfilePicture(userId: string, file: Express.Multer.File) : Promise<{statusCode: HttpStatus, message: string}> {
        await this.userModel.findOneAndUpdate({_id: userId}, {profilePhoto: file?.filename }, {new: true});
        return {statusCode: HttpStatus.OK, message: "Image uploaded !"};
    }

    async purchaseAvatar(user: User, unlock: string, coins: number) : Promise<{statusCode: HttpStatus, coins: number, unlockedStyles: string[]}> {
        if (user.coins < coins) {
            throw new NotAcceptableException('Not enough coins !');
        }

        if (user.unlockedStyle.includes(unlock)) {
            throw new NotAcceptableException('Already unlocked avatar !');
        }

        const updated = await this.userModel.findOneAndUpdate({_id: user.id}, {
            $addToSet: {unlockedStyle: unlock},
            $set: {coins: user.coins - coins}
        }, {new: true});

        return {statusCode: HttpStatus.OK, coins: updated.coins, unlockedStyles: updated.unlockedStyle};
    }
}
