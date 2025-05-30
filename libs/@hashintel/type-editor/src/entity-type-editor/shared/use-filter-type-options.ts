import type {
  BaseUrl,
  EntityType,
  PropertyType,
} from "@blockprotocol/type-system";
import {
  compareOntologyTypeVersions,
  extractBaseUrl,
  extractVersion,
} from "@blockprotocol/type-system";
import { useMemo } from "react";

/**
 * Return a list of types options, minus any exclusions, returning only the latest version of each
 * @param typeOptions the list of types to filter
 * @param typesToExclude the types to exclude from the list (all versions will be excluded)
 */
export const useFilterTypeOptions = <T extends PropertyType | EntityType>({
  typeOptions,
  typesToExclude,
}: {
  typeOptions: T[];
  typesToExclude: Pick<T, "$id">[];
}) => {
  return useMemo(() => {
    const baseUrlsToExclude = typesToExclude.map((excludedType) =>
      extractBaseUrl(excludedType.$id),
    );

    const filteredTypeOptions = new Map<BaseUrl, T>();

    for (const option of typeOptions) {
      const optionBaseUrl = extractBaseUrl(option.$id);
      if (baseUrlsToExclude.includes(optionBaseUrl)) {
        continue;
      }

      const existingOption = filteredTypeOptions.get(optionBaseUrl);
      if (
        !existingOption ||
        compareOntologyTypeVersions(
          extractVersion(existingOption.$id),
          extractVersion(option.$id),
        ) < 0
      ) {
        filteredTypeOptions.set(optionBaseUrl, option);
      }
    }

    return Array.from(filteredTypeOptions.values());
  }, [typeOptions, typesToExclude]);
};
