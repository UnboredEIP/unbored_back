import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RemoveEventRateDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    readonly rateId: string;
}