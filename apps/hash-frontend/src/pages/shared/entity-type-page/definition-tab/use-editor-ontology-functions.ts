import {
  getEntityTypeById,
  getPropertyTypeById,
} from "@blockprotocol/graph/stdlib";
import type {
  EntityTypeWithMetadata,
  PropertyTypeWithMetadata,
  VersionedUrl,
  WebId,
} from "@blockprotocol/type-system";
import { makeOntologyTypeVersion } from "@blockprotocol/type-system";
import type {
  EditorOntologyFunctions,
  EntityTypeEditorProps,
} from "@hashintel/type-editor";
import { useCallback } from "react";

import { useBlockProtocolCreateEntityType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-create-entity-type";
import { useBlockProtocolCreatePropertyType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-create-property-type";
import { useBlockProtocolGetEntityType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-get-entity-type";
import { useBlockProtocolGetPropertyType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-get-property-type";
import { useBlockProtocolUpdateEntityType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-update-entity-type";
import { useBlockProtocolUpdatePropertyType } from "../../../../components/hooks/block-protocol-functions/ontology/use-block-protocol-update-property-type";
import { useFetchEntityTypes } from "../../../../shared/entity-types-context/hooks";
import { useRefetchPropertyTypes } from "../../../../shared/property-types-context";
import { canUserEditType } from "../../../../shared/readonly-mode";
import { useAuthInfo } from "../../auth-info-context";
import { useGenerateTypeUrlsForUser } from "../../use-generate-type-urls-for-user";

export const useEditorOntologyFunctions = (
  webId: WebId | null,
  typesWithMetadata: Record<
    VersionedUrl,
    EntityTypeWithMetadata | PropertyTypeWithMetadata
  >,
): EntityTypeEditorProps["ontologyFunctions"] => {
  const { authenticatedUser } = useAuthInfo();

  const { getEntityType } = useBlockProtocolGetEntityType();
  const { createEntityType } = useBlockProtocolCreateEntityType(webId);
  const { updateEntityType } = useBlockProtocolUpdateEntityType();

  const { getPropertyType } = useBlockProtocolGetPropertyType();
  const { createPropertyType } = useBlockProtocolCreatePropertyType(webId);
  const { updatePropertyType } = useBlockProtocolUpdatePropertyType();

  const refetchEntityTypes = useFetchEntityTypes();
  const refetchPropertyTypes = useRefetchPropertyTypes();

  const wrappedCreateEntityType = useCallback<
    EditorOntologyFunctions["createEntityType"]
  >(
    (args) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createEntityType(args as any).then(async (res) => {
        await refetchEntityTypes();
        return res;
      });
    },
    [createEntityType, refetchEntityTypes],
  );

  const wrappedUpdateEntityType = useCallback<
    EditorOntologyFunctions["updateEntityType"]
  >(
    (args) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return updateEntityType(args as any).then(async (res) => {
        await refetchEntityTypes();
        return res;
      });
    },
    [updateEntityType, refetchEntityTypes],
  );

  const wrappedCreatePropertyType = useCallback<
    EditorOntologyFunctions["createPropertyType"]
  >(
    (args) => {
      return createPropertyType(args).then(async (res) => {
        await refetchPropertyTypes();
        return res;
      });
    },
    [createPropertyType, refetchPropertyTypes],
  );

  const wrappedUpdatePropertyType = useCallback<
    EditorOntologyFunctions["updatePropertyType"]
  >(
    (args) => {
      return updatePropertyType(args).then(async (res) => {
        await refetchPropertyTypes();
        return res;
      });
    },
    [updatePropertyType, refetchPropertyTypes],
  );

  const generateTypeUrlsForUser = useGenerateTypeUrlsForUser();

  const validateTitle = useCallback<EditorOntologyFunctions["validateTitle"]>(
    async ({ kind, title }) => {
      const { versionedUrl } = generateTypeUrlsForUser({
        kind,
        title,
        version: makeOntologyTypeVersion({ major: 1 }),
      });

      const res = await (kind === "entity-type"
        ? getEntityType({ data: { entityTypeId: versionedUrl } })
        : getPropertyType({ data: { propertyTypeId: versionedUrl } }));

      if (!res.data) {
        return {
          allowed: false,
          message: "Error checking whether title exists",
        };
      }

      const typeIsPresent =
        kind === "entity-type"
          ? getEntityTypeById(res.data, versionedUrl)
          : getPropertyTypeById(res.data, versionedUrl);

      if (typeIsPresent) {
        return {
          allowed: false,
          message: `${
            kind === "entity-type" ? "Entity" : "Property"
          } title must be unique`,
        };
      }

      return {
        allowed: true,
        message: "ok",
      };
    },
    [generateTypeUrlsForUser, getEntityType, getPropertyType],
  );

  const canEditResource = useCallback<
    EditorOntologyFunctions["canEditResource"]
  >(
    ({ kind, resource }) => {
      if (!authenticatedUser?.accountSignupComplete) {
        return {
          allowed: false,
          message: `${
            authenticatedUser ? "Complete sign up" : "Sign in"
          } to edit ${kind === "link-type" ? "link" : "property"} type.`,
        };
      }

      const resourceMetadata = typesWithMetadata[resource.$id]?.metadata;
      const resourceAccountId =
        resourceMetadata &&
        "webId" in resourceMetadata &&
        resourceMetadata.webId;

      return resourceAccountId &&
        canUserEditType(resourceAccountId, authenticatedUser)
        ? {
            allowed: true,
            message: "ok",
          }
        : {
            allowed: false,
            message: `Can't edit ${
              kind === "link-type" ? "link entity" : "property"
            } types that belong to other users or organizations you aren't a member of`,
          };
    },
    [typesWithMetadata, authenticatedUser],
  );

  return {
    createEntityType: wrappedCreateEntityType,
    updateEntityType: wrappedUpdateEntityType,
    createPropertyType: wrappedCreatePropertyType,
    updatePropertyType: wrappedUpdatePropertyType,
    validateTitle,
    canEditResource,
  };
};
