import { setTheme, setTitle, snapshot, type DocSnapshot, type ThemePatch } from "@Prezzy/editor-doc";
import { Injectable } from "@nestjs/common";
import { DocEditor } from "@/deck-actions/doc-editor";

@Injectable()
export class DeckService {
  constructor(private readonly editor: DocEditor) {}

  get(userId: string, presentationId: string): Promise<DocSnapshot> {
    return this.editor.withDoc(userId, presentationId, snapshot);
  }

  setTitle(userId: string, presentationId: string, title: string) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      setTitle(doc, title);
      return { presentationId, title };
    });
  }

  setTheme(userId: string, presentationId: string, theme: ThemePatch) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      setTheme(doc, theme);
      return { presentationId };
    });
  }
}
