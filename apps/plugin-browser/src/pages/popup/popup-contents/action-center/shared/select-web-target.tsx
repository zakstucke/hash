import type { WebId } from "@blockprotocol/type-system";
import type { SxProps, Theme } from "@mui/material";
import { FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";

import type { LocalStorage } from "../../../../../shared/storage";
import { darkModeInputColor } from "../../../../shared/style-values";
import { WebSelector } from "./select-web-target/web-selector";

const createRadioItemSx = (active: boolean): SxProps<Theme> => ({
  color: ({ palette }) => (active ? palette.gray[90] : palette.gray[70]),
  fontSize: 14,
  m: 0,
  "@media (prefers-color-scheme: dark)": {
    color: ({ palette }) => (active ? darkModeInputColor : palette.gray[60]),
  },
});

type SelectWebTargetProps = {
  createAs: "draft" | "live";
  setCreateAs: (createAs: "draft" | "live") => void;
  webId: WebId;
  setWebId: (webId: WebId) => void;
  user: NonNullable<LocalStorage["user"]>;
};

export const SelectWebTarget = ({
  createAs,
  setCreateAs,
  webId,
  setWebId,
  user,
}: SelectWebTargetProps) => {
  return (
    <RadioGroup
      name="radio-buttons-group"
      onChange={(event) => setCreateAs(event.target.value as "draft" | "live")}
      value={createAs}
    >
      <Stack direction="row" spacing={1} mb={1.5}>
        <FormControlLabel
          value="draft"
          control={<Radio sx={{ mr: 1 }} />}
          label="Add them as drafts to the review queue in"
          sx={createRadioItemSx(createAs === "draft")}
        />
        <WebSelector
          active={createAs === "draft"}
          selectedWebWebId={webId}
          setSelectedWebWebId={setWebId}
          user={user}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormControlLabel
          value="live"
          control={<Radio sx={{ mr: 1 }} />}
          label="Create them automatically in"
          sx={createRadioItemSx(createAs === "live")}
        />
        <WebSelector
          active={createAs === "live"}
          selectedWebWebId={webId}
          setSelectedWebWebId={setWebId}
          user={user}
        />
      </Stack>
    </RadioGroup>
  );
};
