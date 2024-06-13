import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsArray, ArrayMinSize, IsOptional, IsDateString } from "class-validator";

export class ParisEventDto {
    @IsOptional()
    @IsString()
    readonly date_end: string;

    @IsOptional()
    @IsArray()
    readonly tags: string[];
}