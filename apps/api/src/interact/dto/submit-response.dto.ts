import { IsOptional, IsString, MinLength } from "class-validator";

export class SubmitResponseDto {
  @IsString()
  @MinLength(1)
  elementId: string;

  @IsString()
  @MinLength(1)
  participantId: string;

  @IsOptional()
  @IsString()
  participantName?: string;

  @IsString()
  value: string;
}
