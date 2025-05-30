import {
  componentsFromVersionedUrl,
  type VersionedUrl,
} from "@blockprotocol/type-system";
import { type FunctionComponent } from "react";

import { DataType } from "../data-type";
import type { SlideItem } from "./types";

type DataTypeSlideProps = {
  dataTypeId: VersionedUrl;
  replaceItem: (item: SlideItem) => void;
};

export const DataTypeSlide: FunctionComponent<DataTypeSlideProps> = ({
  dataTypeId,
  replaceItem,
}) => {
  const { baseUrl, version } = componentsFromVersionedUrl(dataTypeId);

  return (
    <DataType
      isInSlide
      dataTypeBaseUrl={baseUrl}
      requestedVersion={version}
      onDataTypeUpdated={(dataType) =>
        replaceItem({ itemId: dataType.schema.$id, kind: "dataType" })
      }
    />
  );
};
