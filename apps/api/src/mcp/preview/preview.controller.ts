import { Controller, Get, Query } from "@nestjs/common";
import { PreviewService } from "@/mcp/preview/preview.service";

@Controller("mcp-preview")
export class PreviewController {
  constructor(private readonly preview: PreviewService) {}

  @Get()
  data(@Query("token") token: string) {
    return this.preview.data(token);
  }
}
