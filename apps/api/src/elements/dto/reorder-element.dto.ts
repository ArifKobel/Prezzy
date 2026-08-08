import { IsIn } from "class-validator";

export type ReorderAction = "front" | "forward" | "backward" | "back";

export class ReorderElementDto {
  @IsIn(["front", "forward", "backward", "back"])
  action: ReorderAction;
}
