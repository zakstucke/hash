import type { EntityId, VersionedUrl } from "@blockprotocol/type-system";
import type { HashEntity } from "@local/hash-graph-sdk/entity";

type SimplifiedEntity = {
  entityId: EntityId;
  entityTypeIds: [VersionedUrl, ...VersionedUrl[]];
  properties: HashEntity["properties"];
  sourceEntityId?: EntityId;
  targetEntityId?: EntityId;
};

/**
 * Simplify the definition of an entity for LLM consumption.
 *
 * @todo consolidate with simplifyProposedEntityForLlmConsumption
 */
export const simplifyEntity = (entity: HashEntity): SimplifiedEntity => ({
  entityId: entity.metadata.recordId.entityId,
  entityTypeIds: entity.metadata.entityTypeIds,
  /**
   * @todo: consider simplifying property keys
   */
  properties: entity.properties,
  sourceEntityId: entity.linkData?.leftEntityId,
  targetEntityId: entity.linkData?.rightEntityId,
});
