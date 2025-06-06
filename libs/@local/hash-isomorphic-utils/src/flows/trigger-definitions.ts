import type { DeepReadOnly, TriggerDefinition } from "./types.js";

export type TriggerDefinitionId =
  | "onFileUpload"
  | "userTrigger"
  | "userVisitedWebPageTrigger"
  | "scheduledTrigger";

const triggerDefinitionsAsConst = {
  onFileUpload: {
    kind: "trigger",
    triggerDefinitionId: "onFileUpload",
    name: "On File Upload",
    outputs: [
      {
        payloadKind: "EntityId",
        name: "fileEntityId" as const,
        array: false,
        required: true,
      },
    ],
  },
  userTrigger: {
    kind: "trigger",
    triggerDefinitionId: "userTrigger",
    name: "User Trigger",
  },
  userVisitedWebPageTrigger: {
    kind: "trigger",
    triggerDefinitionId: "userVisitedWebPageTrigger",
    name: "User Visited Web Page Trigger",
    outputs: [
      {
        payloadKind: "Text",
        name: "visitedWebPageUrl" as const,
        array: false,
        required: true,
      },
    ],
  },
  scheduledTrigger: {
    kind: "trigger",
    triggerDefinitionId: "scheduledTrigger",
    name: "Scheduled Trigger",
    outputs: [
      {
        payloadKind: "Text",
        name: "scheduledAtTime" as const,
        array: false,
        required: true,
      },
    ],
  },
} as const satisfies Record<
  TriggerDefinitionId,
  DeepReadOnly<TriggerDefinition>
>;

export type OutputNameForTrigger<
  T extends keyof typeof triggerDefinitionsAsConst,
> = (typeof triggerDefinitionsAsConst)[T] extends {
  outputs: { name: string }[];
}
  ? (typeof triggerDefinitionsAsConst)[T]["outputs"][number]["name"]
  : never;

export const triggerDefinitions =
  triggerDefinitionsAsConst as unknown as Record<
    TriggerDefinitionId,
    TriggerDefinition
  >;
