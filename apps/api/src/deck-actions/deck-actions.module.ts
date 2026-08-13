import { Module } from "@nestjs/common";
import { CollabModule } from "@/collab/collab.module";
import { DeckService } from "@/deck-actions/deck.service";
import { DocEditor } from "@/deck-actions/doc-editor";
import { ElementActionsService } from "@/deck-actions/element-actions.service";
import { SlideActionsService } from "@/deck-actions/slide-actions.service";
import { PresentationsModule } from "@/presentations/presentations.module";

const services = [DeckService, SlideActionsService, ElementActionsService];

@Module({
  imports: [CollabModule, PresentationsModule],
  providers: [DocEditor, ...services],
  exports: [...services, PresentationsModule],
})
export class DeckActionsModule {}
