import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { AddEventDto } from './dto/AddEvent.dto';
import { RemoveEventDto } from './dto/RemoveEvent.dto';
import { Events } from 'src/events/schemas/events.schema';
import { RateEventDto } from './dto/RateEvent.Dto';
import { RemoveEventRateDto } from './dto/DeleteEventRate.dto';

@Injectable()
export class EventService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectModel(Events.name)
        private eventModel: Model<Events>,
    ){}

    async showEvent(user : User) : Promise<{statusCode: HttpStatus, reservations: string[]}> {
        return {statusCode: HttpStatus.OK, reservations: user.reservations};
    }

    async showEventsFromUser(user: User) : Promise<{statusCode: HttpStatus, reservations: any[]}> {
        const test = await this.eventModel.find({_id: {$in: user.reservations}});
        return {statusCode: HttpStatus.OK, reservations: test};
    }

    async addEvent(userId : string, addEvent : AddEventDto) : Promise<{statusCode: HttpStatus, reservations: string[]}> {
        try {
            const existingEvents = (await this.eventModel.find({ _id: { $in: addEvent.events } }))
            if (existingEvents.length < 1)
                throw new BadRequestException("Bad request")
            await this.eventModel.updateMany({ _id: { $in: existingEvents } }, { $addToSet: { participents: userId } });
        } catch (err) {
            throw new BadRequestException("Bad request")
        }
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, { $addToSet : { reservations: { $each: addEvent.events }}}, {new: true})
        return {statusCode: HttpStatus.OK, reservations: updatedUser.reservations};
    }

    async removeEvent(userId : string, deleteEvent : RemoveEventDto) : Promise<{statusCode: HttpStatus, reservations: string[]}> {
        try {
            const existingEvents = (await this.eventModel.find({_id: {$in: deleteEvent.events}}))
            console.log(existingEvents)
            if (existingEvents.length < 1)
                throw new BadRequestException('Bad request')
            await this.eventModel.updateMany({ _id: { $in: existingEvents } }, { $pull: { participents: userId } });
        } catch (err) {
            throw new BadRequestException('Bad Request')
        }
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, { $pull : {reservations: {$in: deleteEvent.events}}}, {new: true});

        return {statusCode: HttpStatus.OK, reservations: updatedUser.reservations};
    }

    async addUnboredRateEvent(eventId : string, rateEventDto : RateEventDto, userId : string) : Promise <{statusCode: HttpStatus, event: Events}> {
        const newID = new Types.ObjectId();
        if (!Types.ObjectId.isValid(eventId)) {
            throw new NotFoundException('Invalid Id');
        }
        const rateEvent = {
            stars: rateEventDto.stars,
            comments: rateEventDto.comments,
            userId: userId,
            id: newID
        }
        const rateEventForUser = {
            idRate: newID,
            event: eventId,
            stars: rateEventDto.stars,
            comments: rateEventDto.comments,
        }
        const updateRate = await this.eventModel.findByIdAndUpdate(eventId, { $addToSet : { rate : rateEvent}}, {new: true})
        await this.userModel.findByIdAndUpdate(userId, { $addToSet : { rates: rateEventForUser}}, {new: true});
        if (!updateRate) {
            throw new NotFoundException('Event not found');
        }
        return {statusCode: HttpStatus.OK, event: updateRate};
    }

    async deleteUnboredRate(userId: string, removeEventRateDto: RemoveEventRateDto) : Promise <{statusCode: HttpStatus, rates: Object}> {
        const hehe1 = await this.userModel.findById(userId);
        const cc = hehe1.rates.find(rate => rate.idRate.toString() === removeEventRateDto.rateId.toString());
        if (!cc) {
            throw new NotFoundException('Could not find this rate');
        }
        const test = new Types.ObjectId(removeEventRateDto.rateId);

        const user = await this.userModel.findOneAndUpdate({_id: userId}, {$pull : {rates : {idRate : test}}}, {new: true});
        await this.eventModel.findOneAndUpdate({_id: cc.event}, {$pull : {rate: {id: test}}});
        return {statusCode: HttpStatus.OK, rates: user.rates}
    }

    async uploadUnboredImage(userId: string, eventId: string, file: Express.Multer.File) : Promise<{statusCode: HttpStatus, message: string}> {
        const pictureForUser = {
            id: file.filename,
            eventId: eventId
        }

        const pictureForEvent = {
            id: file.filename,
            userId: userId
        }
        if (!Types.ObjectId.isValid(eventId))
            throw new NotFoundException("Invalid Id");
        try {
            await this.userModel.findOneAndUpdate({_id: userId}, {$addToSet: {pictures: pictureForUser}}, {new: true});
            await this.eventModel.findOneAndUpdate({_id: eventId}, {$addToSet: {pictures: pictureForEvent}}, {new: true})
            return {statusCode: HttpStatus.OK, message: "Image uploaded !"};
        } catch (err) {
            throw new BadRequestException("Bad request");
        }
    }

    async addFavorites(userId: string, addEvent: AddEventDto) : Promise<{statusCode: HttpStatus, message: string}> {
        try {
            const existingEvents = (await this.eventModel.find({ _id: { $in: addEvent.events } }))
            if (existingEvents.length < 1)
                throw new BadRequestException("Bad request")
        } catch (err) {
            throw new BadRequestException("Bad request")
        }
        await this.userModel.findOneAndUpdate({_id: userId}, { $addToSet : { favorites: { $each: addEvent.events }}});
        return {statusCode: HttpStatus.OK, message: "Successfully added to favorites"}
    }

    async removeFavorites(userId: string, removeEvent: RemoveEventDto) : Promise<{statusCode: HttpStatus, message: string}> {
        try {
            const existingEvents = (await this.eventModel.find({ _id: { $in: removeEvent.events } }))
            if (existingEvents.length < 1)
                throw new BadRequestException("Bad request")
        } catch (err) {
            throw new BadRequestException("Bad request")
        }
        await this.userModel.findOneAndUpdate({_id: userId}, { $pull : {favorites: {$in: removeEvent.events}}});
        return {statusCode: HttpStatus.OK, message: "Successfully remove from favorites"}
    }

}
