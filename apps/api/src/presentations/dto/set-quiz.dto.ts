import { IsIn, IsString } from "class-validator";
import type { QuizPhase } from "@/shared";

export class SetQuizDto {
  @IsString()
  elementId: string;

  @IsIn(["question", "answering", "results"])
  phase: QuizPhase;
}
