import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { AudienceResponse } from "@/shared";
import { SubmitResponseDto } from "@/interact/dto/submit-response.dto";
import { ResponsesService } from "@/interact/responses.service";

@Controller()
export class ResponsesController {
  constructor(private readonly responses: ResponsesService) {}

  @Get("elements/:elementId/responses")
  list(@Param("elementId") elementId: string): Promise<AudienceResponse[]> {
    return this.responses.listByElement(elementId);
  }

  @Post("responses")
  submit(@Body() dto: SubmitResponseDto): Promise<AudienceResponse> {
    return this.responses.submit(dto);
  }
}
