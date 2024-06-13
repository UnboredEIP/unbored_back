import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, IsEmail, IsArray, IsDateString, ArrayMinSize, IsOptional } from "class-validator";

export class RateEventDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly stars: string;

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    @ApiProperty()
    readonly comments: string;
}