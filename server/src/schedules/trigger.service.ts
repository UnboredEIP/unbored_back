import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Interval, Timeout } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Events } from 'src/events/schemas/events.schema';

@Injectable()
export class TriggerService {
    constructor(
        @InjectModel(Events.name)
        private eventModel: Model<Events>,
    ){}
    @Interval(10000)
    async handleInterval() {
        // console.log('10s');
    }
}