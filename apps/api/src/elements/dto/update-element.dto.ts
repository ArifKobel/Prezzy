import { Type } from "class-transformer";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";
import { ElementPropsDto } from "./element-props.dto";

export class UpdateElementDto {
  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ElementPropsDto)
  props?: ElementPropsDto;
}
