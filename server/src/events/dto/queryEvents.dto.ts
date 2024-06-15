import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class QueryEventsDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly pageSize: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly page: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly email: string;
}