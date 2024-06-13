import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose';

export enum Gender {
    HOMME = "Homme",
    FEMME = "Femme",
    AUTRE = "Autre",
}

export enum Role {
    USER = "User",
    PRO = "Pro",
    ADMIN = "Admin",
}

@Schema({versionKey: false})
export class User extends Document {
    @Prop({unique: [ true, 'Duplicated username entered']})
    username: string;

    @Prop({unique: [ true, 'Duplicated email entered']})
    email: string;

    @Prop()
    password: string;

    @Prop()
    resetToken: string;

    @Prop({type: Object})
    otp: {
        value: string;
        createdAt: Date;
    };

    @Prop({required: false})
    profilePhoto: string;

    @Prop({required: false})
    description: string;

    @Prop()
    role: string;

    @Prop()
    gender: Gender;

    @Prop()
    birthdate: Date;

    @Prop()
    preferences: string[];

    @Prop()
    reservations: string[];

    @Prop()
    pastReservations: string[];

    @Prop({type: Object, 
        default: {head: {id: 0, color: 0},
        eyebrows: {id: 0, color: 0},
        hair: {id: 0, color: 0},
        eyes: {id: 0, color: 0},
        mouth: {id: 0, color: 0},
        beard: {id: 0, color: 0},
        accessory: {id: 0, color: 0}},
        clothes: {id: 0, color: 0},
    })
    style: {
        head: {
            id: string,
            color: string,
        },
        eyebrows: {
            id: string,
            color: string,
        }
        hair: {
            id: string,
            color: string,
        },
        eyes: {
            id: string,
            color: string,
        },
        mouth: {
            id: string,
            color: string,
        },
        beard: {
            id: string,
            color: string,
        },
        accessory: {
            id: string,
            color: string,
        },
        clothes: {
            id: string,
            color: string,
        }
    }

    @Prop({default: []})
    unlockedStyle: string[];

    @Prop()
    rates: {
        event: string;
        idRate: string;
        comment: string;
        stars: string;
    }[];

    @Prop()
    pictures: {
        id: string;
        eventId: string;
    }[];

    @Prop()
    friends: {
        _id: string,
    }[];

    @Prop()
    groups: {
        _id: string
        joinedAt: Date,
    }[];

    @Prop({default: []})
    parisLike: string[];

    @Prop({type: Object, default: {groups:[], friends:[]}})
    invitations: {
        groups: {
            _id: string,
            createdAt: Date,    
        }[],
        friends: {
            _id: string,
            createdAt: Date, 
        }[],
    };

    @Prop()
    favorites: string[]
}

export const UserSchema = SchemaFactory.createForClass(User)