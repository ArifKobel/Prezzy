import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, ValidateNested } from "class-validator";
import type { ElementType } from "@/shared";
import { ELEMENT_TYPES } from "@/elements/element-types";
import { ElementPropsDto } from "@/elements/dto/element-props.dto";

export class CreateElementDto {
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

  @IsOptional()
  @IsNumber()
  zIndex?: number;
}
