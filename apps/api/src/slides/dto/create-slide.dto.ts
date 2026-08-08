import { IsNumber, IsOptional } from "class-validator";

export class CreateSlideDto {
  @IsOptional()
  @IsNumber()
  afterOrder?: number;
}
