import { IsOptional, IsString, MinLength } from "class-validator";

export class HeartbeatDto {
  @IsString()
  @MinLength(1)
  participantId: string;

  @IsOptional()
  @IsString()
  participantName?: string;
}
