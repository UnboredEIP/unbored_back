import { IsEnum, IsNotEmpty, IsString, IsEmail, IsArray, IsDateString, IsOptional } from "class-validator";
import { Gender } from "../schemas/user.schema";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly username: string;

    @IsNotEmpty()
    @IsEmail({}, { message: "Please enter a correct email"})
    @ApiProperty()
    readonly email: string;

    @IsNotEmpty()
    @IsEnum(Gender, { message : "Please enter a correct gender"})
    @ApiProperty({enum: Gender})
    readonly gender: Gender;

    @IsString()
    @IsOptional()
    @ApiProperty({required: false})
    readonly description: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly password: string;

    @IsNotEmpty()
    @IsDateString()
    @ApiProperty()
    readonly birthdate: string;

    @IsOptional()
    @IsArray()
    @ApiProperty({required: false})
    readonly preferences: string[];

    @IsOptional()
    @IsString()
    @ApiProperty({required: false})
    readonly otp: string;
}