import { IsEnum, IsString, IsEmail, IsDateString, IsOptional, IsArray } from "class-validator";
import { Gender } from "../../auth/schemas/user.schema";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateDto {
    @IsOptional({always: true})
    @IsString()
    @ApiProperty()
    readonly username: string;

    @IsOptional({always: true})
    @IsEmail({}, { message: "Please enter a correct email"})
    @ApiProperty()
    readonly email: string;

    @IsOptional({always: true})
    @IsEnum(Gender, { message : "Please enter a correct gender"})
    @ApiProperty({enum: Gender})
    readonly gender: Gender;

    @IsOptional({always: true})
    @IsString()
    @ApiProperty()
    password: string;

    @IsOptional({always: true})
    @IsDateString()
    @ApiProperty()
    readonly birthdate: string;

    @IsOptional({always: true})
    @IsArray()
    @ApiProperty()
    readonly preferences: string;
    

    @IsOptional({always: true})
    @IsArray()
    @ApiProperty()
    readonly description: string;
}