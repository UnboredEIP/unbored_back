import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Events } from './schemas/events.schema';
import { EditEventDto } from './dto/editEvent.dto';
import { CreateEventDto } from './dto/createEvent.dto';
import { User } from 'src/auth/schemas/user.schema';
import { QueryEventsDto } from './dto/queryEvents.dto';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Events.name)
        private eventModel: Model<Events>,
        @InjectModel(User.name)
        private userModel: Model<User>,
    ) {}

    async listAllEvent(id: string) : Promise <{statusCode: HttpStatus, events: Object[]}> {
        const Events = await this.eventModel.find({
            $or: [
                {private: true, creator: id},
                {private: false}
            ]
        })
        return {statusCode: HttpStatus.OK, events: Events};
    }


    async listAllPublicEvent(query: QueryEventsDto) : Promise <{statusCode: HttpStatus, events: Object[], total: number}> {
        const pageSize = parseInt(query.pageSize);
        const page = parseInt(query.page);

        const queries = {
            private: false
        };

        Object.keys(query).forEach(key => {
            if (key === 'email')
                queries[key]= {$regex: query[key], $options: "i"}
        })

        if (pageSize <= 0 || page <= 0)
            throw new BadRequestException("Bad request")

        const Events = await this.eventModel.find(queries).skip(pageSize * (page - 1)).limit(pageSize)
        const Total = await this.eventModel.countDocuments(queries)
        return {statusCode: HttpStatus.OK, events: Events, total: Total};
    }

    async getEventById(eventId: string) : Promise<{statusCode: HttpStatus, event: Events}> {
        if (!Types.ObjectId.isValid(eventId)) {
            throw new NotFoundException('Invalid Id');
        }
        const event = await this.eventModel.findById(eventId);
        if (!event) {
            throw new NotFoundException("Invalid Id");
        }
        return {statusCode: HttpStatus.OK, event: event};
    }

    async createUnboredPrivateEvent(id: string, createEventDto: CreateEventDto) :  Promise<{statusCode: HttpStatus, event: Events}>{
        const { name, categories, address, description, start_date, end_date } = createEventDto;
        const event = await this.eventModel.create({
            name,
            categories,
            description,
            address,
            start_date,
            end_date,
            creator: id,
            private: true,
        })
        return {statusCode: HttpStatus.CREATED, event: event};
    }

    async createUnboredEvent(id: string, createEventDto : CreateEventDto) : Promise<{statusCode: HttpStatus, event: Events}>{
        const { name, categories, description, address, start_date, end_date, price, age, phone, email, rewards, coins} = createEventDto;
        const duplicatedEvent = await this.eventModel.find({ name });
        for (let ev in duplicatedEvent) {
            if (duplicatedEvent[ev].private === false) {
                throw new ConflictException("Duplicated Key");
            }
        }
        if (end_date && end_date < start_date)
            throw new BadRequestException("end_date should be greater than start_date")

        const event = await this.eventModel.create({
            name,
            categories,
            address,
            description,
            start_date,
            end_date,
            creator: id,
            price,
            phone,
            age,
            email,
            rewards,
            coins,
            private: false,
        })
        return {statusCode: HttpStatus.CREATED, event: event};
    }

    async deleteUserFromEvent(id: string, eventId: string, userList: string[]) : Promise<{statusCode: HttpStatus, message: string}> {
        const exists = await this.eventModel.findOne({_id: eventId})
        if (exists?.creator !== id)
            throw new BadRequestException("You are not the owner of this event")
        // await this.eventModel.findOneAndUpdate({_id: eventId}, {$pull: {'participents.user': {$in: userList}}})
        await this.eventModel.findOneAndUpdate({ _id: eventId }, {$pull: { participents: { user: { $in: userList } } } });
        return {statusCode: HttpStatus.OK, message: "Successfully deleted"}
    }

    async deleteUnboredEvent(actualId: string, eventId : string) : Promise <{statusCode: HttpStatus, message: string}> {
        if (!Types.ObjectId.isValid(eventId)) {
            throw new NotFoundException('Invalid Id');
        }
        const exists = await this.eventModel.findById(eventId);
        if (!exists) {
            throw new NotFoundException("Could not find this event");
        }
        if (actualId === exists.creator) {
            for (let img of exists.pictures) {
                await this.userModel.findOneAndUpdate({_id: img.userId}, { $pull: { pictures: {id: img.id}}});
                await this.deleteImage(img.id);
            }
            await this.eventModel.deleteOne({_id: eventId});
        }
        return {statusCode: HttpStatus.OK, message: "Succefully deleted !"}
    }

    async editUnboredEvent(actualId: string, editEventDto: EditEventDto, eventId : string) : Promise <{statusCode: HttpStatus, event: Events}> {
        const { name } = editEventDto;
        let event : Events;
        if (!Types.ObjectId.isValid(eventId)) {
            throw new NotFoundException('Invalid Id');
        }
        const findId = await this.eventModel.findById(eventId)
        if (!findId)
            throw new NotFoundException('Event not existing')
        const duplicatedEvent = await this.eventModel.findOne({ name });
        if (duplicatedEvent && duplicatedEvent._id.toString() !== eventId)
            throw new ConflictException("Duplicated Key");
        if (actualId === findId.creator)
            event = await this.eventModel.findByIdAndUpdate(eventId, editEventDto, {new: true});
        return {statusCode: HttpStatus.OK, event: event};
    }

    async setLike(id: string, user: User) : Promise<{statusCode: HttpStatus, message: string}> {
        await this.userModel.findByIdAndUpdate(user._id, { $addToSet: {parisLike: id}});
        return {statusCode: HttpStatus.OK, message: "Succesfully liked"}
    }


    async deleteImage(filename: string): Promise<Boolean> {
        try {
            const fs = require('fs');
            const imagePath = `./data/images/${filename}`;
            if (fs.existsSync(imagePath)) {
                await fs.unlinkSync(imagePath);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    async validateTicket(creatorId: string, key: string, userId: string, eventId: string) : Promise<{statusCode: HttpStatus, message: string}> {
        if (!(creatorId && key && userId && eventId))
            throw new BadRequestException('Missing either creatorId, key, userId or eventId')
        const event = await this.eventModel.findById(eventId);
        if (creatorId.toString() !== event.creator) {
            throw new UnauthorizedException('You are not the owner of this event')
        }
        const user = event.participents.find(event => event.user === userId)
        if (!user) {
            throw new NotFoundException('Could not find this user ticket')
        }
        if (user.key !== key) {
            throw new UnauthorizedException('Ticket is not valid')
        }
        if (user.registered === true) {
            throw new UnauthorizedException('Ticket has already been used')
        }
        await this.eventModel.findOneAndUpdate({"participents.key": key}, {participents: event.participents.map(item => {if (item.user === userId) item.registered = true; return item})});
        return {statusCode: HttpStatus.ACCEPTED, message: "User registered"}
    }
}
