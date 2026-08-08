import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { ReplaceElementDto } from "@/elements/dto/replace-element.dto";

export class ReplaceElementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceElementDto)
  elements: ReplaceElementDto[];
}
