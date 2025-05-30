import type { WebId } from "@blockprotocol/type-system";
import type { EditorState } from "prosemirror-state";
import type { DirectEditorProps } from "prosemirror-view";
import { EditorView } from "prosemirror-view";

import type { RenderPortal } from "./block-portals";
import { clipboardTextSerializer } from "./clipboard-text-serializer";
import { mentionNodeView } from "./mention-view/mention-node-view";

export const createTextEditorView = (
  state: EditorState,
  renderNode: HTMLElement,
  renderPortal: RenderPortal,
  webId: WebId,
  editorProps?: Partial<DirectEditorProps>,
) =>
  new EditorView(renderNode, {
    ...editorProps,
    state,
    clipboardTextSerializer: clipboardTextSerializer(
      state.schema.nodes.hardBreak,
    ),
    nodeViews: {
      ...(editorProps?.nodeViews ?? {}),
      mention: mentionNodeView(renderPortal, webId),
    },
  });
