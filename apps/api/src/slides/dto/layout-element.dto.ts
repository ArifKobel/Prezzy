import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { ElementPropsDto } from "../../elements/dto/element-props.dto";
import { ELEMENT_TYPES } from "../../elements/element-types";
import type { ElementType } from "../../shared";

export class LayoutElementDto {
  @IsIn(ELEMENT_TYPES)
  type: ElementType;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ElementPropsDto)
  props?: ElementPropsDto;
}
