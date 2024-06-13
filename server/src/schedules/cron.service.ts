import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';
import { Events } from 'src/events/schemas/events.schema';

@Injectable()
export class CronService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectModel(Events.name)
        private eventModel: Model<Events>,
    ){}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async deleteUserOtp() {
        const actual = new Date();
        const users = await this.userModel.find({otp:{$exists:true}})
        for (let user of users) {
            const diff = actual.getTime() - user.otp.createdAt.getTime();
            const diffInMinutes = Math.floor(diff / (1000 * 60));
            if (diffInMinutes > 5) {
                await this.userModel.findOneAndDelete({email: user.email});
            }
        }
    }

    @Cron(CronExpression.EVERY_12_HOURS)
    async deleteUnusedImage() {
        var fs = require('fs');
        var files = fs.readdirSync('./data/images');
        for (let img of files) {
            const user = await this.userModel.find({"pictures": img});
            const ev = await this.eventModel.find({"pictures.id": img});
            if (!(user || ev)) {
                const imagePath = `./data/images/${img}`;
                await fs.unlinkSync(imagePath);
            }
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async deleteEndEvent() {
        const actual = new Date();
        const events = await this.eventModel.find({$and: [{"end_date": { $lte: actual }}, {end: false}]});
        for (let event of events) {
            if (event.rewards) {
                for (let userId of event.participents) {
                    const eventId = event._id.toString();
                    await this.userModel.findOneAndUpdate({_id: userId}, 
                    { 
                        $addToSet: {unlockedStyle: { $each: event.rewards}},
                        $push: {pastReservations: eventId},
                        $pull: { reservation: eventId},
                    }
                );
                }
            }
            await this.eventModel.findOneAndUpdate({name: event.name}, {"end": true})
        }
    }

    @Cron(CronExpression.EVERY_12_HOURS)
    async deleteUnusedEventId() {
        const users = await this.userModel.find({ 'reservations': { $exists: true, $not: { $size: 0 } } });

        const isValidReservation = async (eventId) => {
            if (Types.ObjectId.isValid(eventId)) {
                const event = await this.eventModel.findById(eventId);
                return event !== null;
            } else {
                return false;
            }
        };
        
        for (let user of users) {
            const validReservations = await Promise.all(user.reservations.map(isValidReservation));
            user.reservations = user.reservations.filter((_, index) => validReservations[index]);
        
            await user.save();
            console.log(user.reservations);
        }
    }
}
