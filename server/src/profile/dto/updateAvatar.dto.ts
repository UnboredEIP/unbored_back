import { Optional } from "@nestjs/common";
import { Prop } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsEmail, IsDateString, IsOptional, ValidateNested } from "class-validator";



class AvatarPart {
    @ApiProperty()
    @IsString()
    @IsOptional() 
    id: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    color: string;
}

export class UpdateAvatarDto {
    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly head: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly eyebrows: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly hair: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly eyes: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly mouth: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly beard: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly accessory: AvatarPart;

    @ApiProperty()
    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarPart)
    readonly clothes: AvatarPart;
}
