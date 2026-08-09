import { IsObject, IsOptional, IsString, ValidateIf } from "class-validator";

const unlessNull = ValidateIf((_: object, value: unknown) => value !== null);

export class ThemeDto {
  @IsOptional()
  @unlessNull
  @IsString()
  base?: string | null;

  @IsOptional()
  @unlessNull
  @IsObject()
  overrides?: Record<string, unknown> | null;

  @IsOptional()
  @unlessNull
  @IsString()
  primaryColor?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  secondaryColor?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  backgroundColor?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  surfaceColor?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  textColor?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  headingFont?: string | null;

  @IsOptional()
  @unlessNull
  @IsString()
  bodyFont?: string | null;
}
