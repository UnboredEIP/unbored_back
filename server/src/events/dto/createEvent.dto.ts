import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsArray, IsDateString, ArrayMinSize, IsOptional } from "class-validator";

export class CreateEventDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly name: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly address: string;

    @IsArray()
    @ArrayMinSize(1)
    @ApiProperty()
    readonly categories: string[];

    @IsOptional()
    @IsDateString()
    @ApiProperty()
    readonly start_date: string;

    @IsOptional()
    @IsDateString()
    @ApiProperty()
    readonly end_date: string;

    @IsOptional()
    @ApiProperty()
    readonly price: string;

    @IsOptional()
    @ApiProperty()
    readonly age: string;

    @IsOptional()
    @ApiProperty()
    readonly phone: string;

    @IsOptional()
    @ApiProperty()
    readonly email: string;

    @IsOptional()
    @ApiProperty()
    readonly description: string;

    @IsOptional()
    @ApiProperty()
    readonly rewards: string[];
}