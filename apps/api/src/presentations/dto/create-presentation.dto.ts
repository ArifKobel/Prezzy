import { IsString, MinLength } from "class-validator";

export class CreatePresentationDto {
  @IsString()
  @MinLength(1)
  title: string;
}
