import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ElementPropsDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  src?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  objectFit?: string;

  @IsOptional()
  @IsNumber()
  borderRadius?: number;

  @IsOptional()
  @IsNumber()
  opacity?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsBoolean()
  flipX?: boolean;

  @IsOptional()
  @IsBoolean()
  flipY?: boolean;

  @IsOptional()
  @IsString()
  shapeType?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsNumber()
  correctOption?: number;

  @IsOptional()
  @IsNumber()
  timerSeconds?: number;

  @IsOptional()
  @IsBoolean()
  timeScoring?: boolean;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsNumber()
  maxResponses?: number;
}
