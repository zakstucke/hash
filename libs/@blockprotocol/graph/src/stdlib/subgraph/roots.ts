import type {
  DataTypeRootType,
  EntityRootType,
  EntityTypeRootType,
  PropertyTypeRootType,
  Subgraph,
  SubgraphRootType,
  Vertex,
} from "../../types/subgraph.js";
import {
  isEntityVertexId,
  isOntologyTypeVertexId,
} from "../../types/subgraph.js";
import { mustBeDefined } from "../../util.js";
import { getDataTypeByVertexId } from "./element/data-type.js";
import { getEntityRevision } from "./element/entity.js";
import { getEntityTypeByVertexId } from "./element/entity-type.js";
import { getPropertyTypeByVertexId } from "./element/property-type.js";

/**
 * Returns all root elements.
 *
 * For a narrower return type, first narrow the type of `subgraph` by using one of the helper type-guards:
 * - {@link isDataTypeRootedSubgraph}
 * - {@link isPropertyTypeRootedSubgraph}
 * - {@link isEntityTypeRootedSubgraph}
 * - {@link isEntityRootedSubgraph}
 *
 * @param subgraph
 */
export const getRoots = <RootType extends SubgraphRootType>(
  subgraph: Subgraph<RootType>,
): RootType["element"][] =>
  subgraph.roots.map((rootVertexId) => {
    if (!("baseId" in rootVertexId && "revisionId" in rootVertexId)) {
      throw new Error(`Invalid vertex ID: ${JSON.stringify(rootVertexId)}`);
    }

    const root = mustBeDefined(
      (subgraph.vertices as Record<string, Record<string, Vertex>>)[
        rootVertexId.baseId
      ]?.[rootVertexId.revisionId.toString()],
      `roots should have corresponding vertices but ${JSON.stringify(
        rootVertexId,
      )} was missing`,
    );

    return root.inner as RootType["element"];
  });

/**
 * A type-guard that can be used to constrain the generic parameter of `Subgraph` to `DataTypeWithMetadata`.
 *
 * Doing so will help TS infer that `getRoots` returns `DataTypeWithMetadata`s, removing the need for additional
 * type checks or casts.
 *
 * @param subgraph
 */
export const isDataTypeRootedSubgraph = (
  subgraph: Subgraph,
): subgraph is Subgraph<DataTypeRootType> => {
  for (const rootVertexId of subgraph.roots) {
    if (!isOntologyTypeVertexId(rootVertexId)) {
      return false;
    }

    mustBeDefined(
      getDataTypeByVertexId(subgraph, rootVertexId),
      `roots should have corresponding vertices but ${JSON.stringify(
        rootVertexId,
      )} was missing`,
    );
  }

  return true;
};

/**
 * A type-guard that can be used to constrain the generic parameter of `Subgraph` to `PropertyTypeWithMetadata`.
 *
 * Doing so will help TS infer that `getRoots` returns `PropertyTypeWithMetadata`s, removing the need for additional
 * type checks or casts.
 *
 * @param subgraph
 */
export const isPropertyTypeRootedSubgraph = (
  subgraph: Subgraph,
): subgraph is Subgraph<PropertyTypeRootType> => {
  for (const rootVertexId of subgraph.roots) {
    if (!isOntologyTypeVertexId(rootVertexId)) {
      return false;
    }

    mustBeDefined(
      getPropertyTypeByVertexId(subgraph, rootVertexId),
      `roots should have corresponding vertices but ${JSON.stringify(
        rootVertexId,
      )} was missing`,
    );
  }

  return true;
};

/**
 * A type-guard that can be used to constrain the generic parameter of `Subgraph` to `EntityTypeWithMetadata`.
 *
 * Doing so will help TS infer that `getRoots` returns `EntityTypeWithMetadata`s, removing the need for additional
 * type checks or casts.
 *
 * @param subgraph
 */
export const isEntityTypeRootedSubgraph = (
  subgraph: Subgraph,
): subgraph is Subgraph<EntityTypeRootType> => {
  for (const rootVertexId of subgraph.roots) {
    if (!isOntologyTypeVertexId(rootVertexId)) {
      return false;
    }

    mustBeDefined(
      getEntityTypeByVertexId(subgraph, rootVertexId),
      `roots should have corresponding vertices but ${JSON.stringify(
        rootVertexId,
      )} was missing`,
    );
  }

  return true;
};

/**
 * A type-guard that can be used to constrain the generic parameter of `Subgraph` to `Entity`.
 *
 * Doing so will help TS infer that `getRoots` returns `Entity`s, removing the need for additional
 * type checks or casts.
 *
 * @param subgraph
 */
export const isEntityRootedSubgraph = (
  subgraph: Subgraph,
): subgraph is Subgraph<EntityRootType> => {
  for (const rootVertexId of subgraph.roots) {
    if (!isEntityVertexId(rootVertexId)) {
      return false;
    }

    mustBeDefined(
      getEntityRevision(subgraph, rootVertexId.baseId, rootVertexId.revisionId),
      `roots should have corresponding vertices but ${JSON.stringify(
        rootVertexId,
      )} was missing`,
    );
  }

  return true;
};
