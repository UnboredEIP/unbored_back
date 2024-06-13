import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayMinSize } from "class-validator";

export class AddEventDto {
    @IsArray()
    @ArrayMinSize(1)
    @ApiProperty()
    readonly events: string[];
}