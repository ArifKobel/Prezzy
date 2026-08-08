import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { LayoutElementDto } from "@/slides/dto/layout-element.dto";

export class CreateSlideFromLayoutDto {
  @IsOptional()
  @IsNumber()
  afterOrder?: number;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutElementDto)
  elements: LayoutElementDto[];
}
