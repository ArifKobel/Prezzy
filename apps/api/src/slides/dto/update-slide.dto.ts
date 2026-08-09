import { IsOptional, IsString, ValidateIf } from "class-validator";

export class UpdateSlideDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  bg?: string | null;
}
