import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
    @ApiProperty({required: true})
    @IsEmail({}, { message: "Please enter a correct email"})
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({required: true})
    readonly password: string;
}