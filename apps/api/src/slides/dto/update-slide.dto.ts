import { IsString } from "class-validator";

export class UpdateSlideDto {
  @IsString()
  title: string;
}
