import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({versionKey: false})
export class Groups extends Document {
    @Prop({unique: [true, 'Duplicated name entered']})
    name: string;

    @Prop()
    leader: string;

    @Prop()
    members: string[];

    @Prop()
    messages: {
        message: string;
        sendAt: Date;
        _id: string;
    }[]
}

export const GroupSchema = SchemaFactory.createForClass(Groups)