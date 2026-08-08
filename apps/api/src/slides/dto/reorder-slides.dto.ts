import { IsArray, IsString } from "class-validator";

export class ReorderSlidesDto {
  @IsArray()
  @IsString({ each: true })
  slideIds: string[];
}
