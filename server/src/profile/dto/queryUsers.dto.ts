import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class QueryUsersDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly username: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly email: string;
}