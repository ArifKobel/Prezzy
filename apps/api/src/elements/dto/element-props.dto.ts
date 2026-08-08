import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ElementPropsDto {
  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsString()
  src?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  objectFit?: string | null;

  @IsOptional()
  @IsNumber()
  borderRadius?: number | null;

  @IsOptional()
  @IsNumber()
  opacity?: number | null;

  @IsOptional()
  @IsNumber()
  rotation?: number | null;

  @IsOptional()
  @IsBoolean()
  flipX?: boolean | null;

  @IsOptional()
  @IsBoolean()
  flipY?: boolean | null;

  @IsOptional()
  @IsString()
  shapeType?: string | null;

  @IsOptional()
  @IsString()
  question?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[] | null;

  @IsOptional()
  @IsNumber()
  correctOption?: number | null;

  @IsOptional()
  @IsNumber()
  timerSeconds?: number | null;

  @IsOptional()
  @IsBoolean()
  timeScoring?: boolean | null;

  @IsOptional()
  @IsString()
  accentColor?: string | null;

  @IsOptional()
  @IsString()
  backgroundColor?: string | null;

  @IsOptional()
  @IsString()
  textColor?: string | null;

  @IsOptional()
  @IsString()
  prompt?: string | null;

  @IsOptional()
  @IsNumber()
  maxResponses?: number | null;

  @IsOptional()
  @IsBoolean()
  heightFitted?: boolean | null;
}
