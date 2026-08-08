import { IsOptional, IsString } from "class-validator";

export class SetLiveSlideDto {
  @IsOptional()
  @IsString()
  slideId?: string | null;
}
