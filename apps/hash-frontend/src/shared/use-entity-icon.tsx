import type {
  Entity,
  EntityTypeWithMetadata,
  VersionedUrl,
} from "@blockprotocol/type-system";
import { AsteriskRegularIcon } from "@hashintel/design-system";
import { systemEntityTypes } from "@local/hash-isomorphic-utils/ontology-type-ids";
import { includesPageEntityTypeId } from "@local/hash-isomorphic-utils/page-entity-type-ids";
import { simplifyProperties } from "@local/hash-isomorphic-utils/simplify-properties";
import type { PageProperties } from "@local/hash-isomorphic-utils/system-types/shared";
import { Box } from "@mui/material";
import type { JSX, ReactElement } from "react";
import { useMemo } from "react";

import { CanvasIcon } from "./icons/canvas-icon";
import { PageLightIcon } from "./icons/page-light-icon";
import { UserIcon } from "./icons/user-icon";
import { UsersRegularIcon } from "./icons/users-regular-icon";

/**
 * @todo H-1978 set SVG icons on system entity types and remove these overrides
 */
export const entityTypeIcons: Record<VersionedUrl, ReactElement> = {
  [systemEntityTypes.user.entityTypeId]: <UserIcon sx={{ fontSize: 12 }} />,
  [systemEntityTypes.organization.entityTypeId]: (
    <UsersRegularIcon sx={{ fontSize: 14, position: "relative", top: 1 }} />
  ),
  [systemEntityTypes.document.entityTypeId]: (
    <PageLightIcon sx={{ fontSize: 13 }} />
  ),
  [systemEntityTypes.canvas.entityTypeId]: <CanvasIcon sx={{ fontSize: 12 }} />,
};

export const useEntityIcon = (params: {
  entity?: Entity;
  entityTypes?: EntityTypeWithMetadata[];
  pageIcon?: JSX.Element;
}) => {
  const { entity, entityTypes, pageIcon } = params;
  return useMemo(() => {
    if (entity) {
      if (includesPageEntityTypeId(entity.metadata.entityTypeIds)) {
        const { icon: customPageIcon } = simplifyProperties(
          entity.properties as PageProperties,
        );

        if (typeof customPageIcon === "string") {
          return (
            <Box component="span" sx={{ fontSize: 14 }}>
              {customPageIcon}
            </Box>
          );
        }

        if (pageIcon) {
          return pageIcon;
        }
      }

      /**
       * @todo H-739 account for 'icon' property being a URL to an image. Combine with TypeIcon
       */
      for (const entityType of entityTypes ?? []) {
        if (entityType.schema.icon) {
          return entityType.schema.icon;
        }

        if (entityTypeIcons[entityType.schema.$id]) {
          return entityTypeIcons[entityType.schema.$id];
        }
      }

      return <AsteriskRegularIcon sx={{ fontSize: 12 }} />;
    }
  }, [entity, entityTypes, pageIcon]);
};
