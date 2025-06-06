import { useQuery } from "@apollo/client";
import type { EntityRootType } from "@blockprotocol/graph";
import { getRoots } from "@blockprotocol/graph/stdlib";
import type { ActorEntityUuid } from "@blockprotocol/type-system";
import type { HashEntity } from "@local/hash-graph-sdk/entity";
import {
  currentTimeInstantTemporalAxes,
  generateVersionedUrlMatchingFilter,
  mapGqlSubgraphFieldsFragmentToSubgraph,
  zeroedGraphResolveDepths,
} from "@local/hash-isomorphic-utils/graph-queries";
import { systemEntityTypes } from "@local/hash-isomorphic-utils/ontology-type-ids";
import type { MachineProperties } from "@local/hash-isomorphic-utils/system-types/machine";
import { useMemo } from "react";

import { useUsers } from "../components/hooks/use-users";
import type {
  GetEntitySubgraphQuery,
  GetEntitySubgraphQueryVariables,
} from "../graphql/api-types.gen";
import { getEntitySubgraphQuery } from "../graphql/queries/knowledge/entity.queries";
import type { MinimalUser } from "../lib/user-and-org";

type MachineActor = {
  accountId: ActorEntityUuid;
  kind: "machine";
  displayName: string;
};

export const isAiMachineActor = (actor: MachineActor): actor is MachineActor =>
  actor.displayName.toLowerCase() === "hash ai";

export type MinimalActor = MinimalUser | MachineActor;

export const useActors = (params: {
  accountIds?: ActorEntityUuid[];
}): { actors?: MinimalActor[]; loading: boolean } => {
  const { accountIds } = params;

  const { users, loading: usersLoading } = useUsers();

  const userActors = useMemo(
    () => users?.filter((user) => accountIds?.includes(user.accountId)),
    [users, accountIds],
  );

  const { data: machineActorsData, loading: machinesLoading } = useQuery<
    GetEntitySubgraphQuery,
    GetEntitySubgraphQueryVariables
  >(getEntitySubgraphQuery, {
    variables: {
      includePermissions: false,
      request: {
        filter: {
          any: (params.accountIds ? [...new Set(params.accountIds)] : []).map(
            (accountId) => ({
              all: [
                {
                  equal: [
                    { path: ["editionProvenance", "createdById"] },
                    { parameter: accountId },
                  ],
                },
                generateVersionedUrlMatchingFilter(
                  systemEntityTypes.machine.entityTypeId,
                  { ignoreParents: true },
                ),
              ],
            }),
          ),
        },
        graphResolveDepths: zeroedGraphResolveDepths,
        temporalAxes: currentTimeInstantTemporalAxes,
        includeDrafts: false,
      },
    },
    fetchPolicy: "cache-first",
    skip: !accountIds?.length,
  });

  const actors = useMemo(() => {
    if (accountIds && accountIds.length === 0) {
      return [];
    }
    if (!machineActorsData || !userActors) {
      return;
    }

    const subgraph = mapGqlSubgraphFieldsFragmentToSubgraph<
      EntityRootType<HashEntity>
    >(machineActorsData.getEntitySubgraph.subgraph);

    const machineActors = getRoots(subgraph).map((entity) => {
      return {
        accountId: entity.metadata.provenance.edition.createdById,
        kind: "machine" as const,
        displayName: (entity.properties as MachineProperties)[
          "https://blockprotocol.org/@blockprotocol/types/property-type/display-name/"
        ],
      };
    });

    return [...machineActors, ...userActors];
  }, [userActors, machineActorsData, accountIds]);

  return {
    actors,
    loading: usersLoading || machinesLoading,
  };
};
