import { Module } from "@nestjs/common";
import { AccessModule } from "@/access/access.module";
import { AuthModule } from "@/auth/auth.module";
import { DbModule } from "@/db/db.module";
import { ElementsModule } from "@/elements/elements.module";
import { EventsModule } from "@/events/events.module";
import { FilesModule } from "@/files/files.module";
import { InteractModule } from "@/interact/interact.module";
import { PresenceModule } from "@/presence/presence.module";
import { PresentationsModule } from "@/presentations/presentations.module";
import { SlidesModule } from "@/slides/slides.module";

@Module({
  imports: [
    DbModule,
    EventsModule,
    AccessModule,
    PresenceModule,
    AuthModule,
    PresentationsModule,
    SlidesModule,
    ElementsModule,
    InteractModule,
    FilesModule,
  ],
})
export class AppModule {}
