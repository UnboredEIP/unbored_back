import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayMinSize } from "class-validator";

export class RemoveEventDto {
    @IsArray()
    @ArrayMinSize(1)
    @ApiProperty()
    readonly events: string[];
}