import { extractWebIdFromEntityId } from "@blockprotocol/type-system";
import {
  ArrowLeftIcon,
  ArrowUpRightAndArrowDownLeftFromCenterIcon,
  ArrowUpRightFromSquareRegularIcon,
  DownloadRegularIcon,
  FileRegularIcon,
  ImageWithCheckedBackground,
  MagnifyingGlassRegularIcon,
  RotateRegularIcon,
  SidebarRegularIcon,
} from "@hashintel/design-system";
import { generateEntityLabel } from "@local/hash-isomorphic-utils/generate-entity-label";
import { simplifyProperties } from "@local/hash-isomorphic-utils/simplify-properties";
import type { FileProperties } from "@local/hash-isomorphic-utils/system-types/shared";
import {
  Box,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import {
  useFileUploads,
  useFileUploadsProgress,
} from "../../../../shared/file-upload-context";
import { FileUploadDropzone } from "../../../settings/shared/file-upload-dropzone";
import { useAuthInfo } from "../../auth-info-context";
import { getFileProperties } from "../../get-file-properties";
import { GrayToBlueIconButton } from "../../gray-to-blue-icon-button";
import { PdfPreview } from "../../pdf-preview";
import { SectionWrapper } from "../../section-wrapper";
import { useEntityEditor } from "./entity-editor-context";

const previewHeight = 250;

const ActionButtonsContainer = ({ children }: PropsWithChildren) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      position: "absolute",
      top: 10,
      right: 10,
    }}
  >
    {children}
  </Stack>
);

const ReplaceFile = ({
  description,
  displayName,
  isImage,
  close,
}: {
  description?: string;
  displayName?: string;
  isImage: boolean;
  close: () => void;
}) => {
  const { entity, onEntityUpdated } = useEntityEditor();
  const { refetch: refetchUser } = useAuthInfo();
  const [fileBeingUploaded, setFileBeingUploaded] = useState<File | null>(null);

  const { uploadFile, uploads } = useFileUploads();
  const uploadsProgress = useFileUploadsProgress();

  const upload = uploads.find((option) =>
    "fileEntityUpdateInput" in option.fileData &&
    option.fileData.fileEntityUpdateInput.existingFileEntityId ===
      entity.metadata.recordId.entityId &&
    "file" in option.fileData
      ? option.fileData.file === fileBeingUploaded
      : false,
  );
  const progress = upload ? uploadsProgress[upload.requestId] : 0;

  const onFilesProvided = async (files: [File, ...File[]]) => {
    const file = files[0];

    setFileBeingUploaded(file);
    try {
      const response = await uploadFile({
        fileData: {
          file,
          description,
          name: displayName,
          fileEntityUpdateInput: {
            existingFileEntityId: entity.metadata.recordId.entityId,
          },
        },
        makePublic: false, // maintain existing visibility settings
        webId: extractWebIdFromEntityId(entity.metadata.recordId.entityId),
      });

      if (response.status === "complete") {
        const {
          createdEntities: { fileEntity },
        } = response;
        onEntityUpdated?.(fileEntity);
      }
    } finally {
      setFileBeingUploaded(null);
    }

    // Refetch the user in case we've replaced a file connected to them (e.g. avatar)
    void refetchUser();

    close();
  };

  if (fileBeingUploaded) {
    return (
      <Box sx={{ position: "relative" }}>
        <CircularProgress
          color={upload?.status === "error" ? "error" : "primary"}
          size={72}
          variant="determinate"
          value={progress}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="smallTextLabels"
            sx={{ fontWeight: 500, mb: 1 }}
          >{`${(progress ?? 0).toFixed(0)}%`}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <FileUploadDropzone
        image={isImage}
        multiple={false}
        onFilesProvided={onFilesProvided}
      />
      <ActionButtonsContainer>
        <Tooltip title="Cancel">
          <Box>
            <GrayToBlueIconButton onClick={close}>
              <ArrowLeftIcon />
            </GrayToBlueIconButton>
          </Box>
        </Tooltip>
      </ActionButtonsContainer>
    </>
  );
};

export const FilePreviewSection = () => {
  const [replacing, setReplacing] = useState(false);

  /**
   * Document-specific state
   */
  const [showSearch, setShowSearch] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const { isDirty, readonly, closedMultiEntityType, entity } =
    useEntityEditor();

  const { isImage, fileUrl } = getFileProperties(entity.properties);

  const fullScreenHandle = useFullScreenHandle();

  const isFullScreen = fullScreenHandle.active;

  if (!fileUrl) {
    return null;
  }

  const { description, displayName, fileName, mimeType } = simplifyProperties(
    entity.properties as FileProperties,
  );

  const title =
    displayName ?? generateEntityLabel(closedMultiEntityType, entity);

  const alt = description ?? title;

  const isPdf = mimeType === "application/pdf" || fileName?.endsWith(".pdf");

  return (
    <SectionWrapper
      title="File Preview"
      titleStartContent={
        isPdf ? (
          <Stack direction="row" gap={1} ml={3}>
            <GrayToBlueIconButton
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <SidebarRegularIcon
                sx={{
                  color: ({ palette }) =>
                    showThumbnails ? palette.blue[70] : undefined,
                }}
              />
            </GrayToBlueIconButton>
            <GrayToBlueIconButton onClick={() => setShowSearch(!showSearch)}>
              <MagnifyingGlassRegularIcon
                sx={{
                  color: ({ palette }) =>
                    showSearch ? palette.blue[70] : undefined,
                }}
              />
            </GrayToBlueIconButton>
          </Stack>
        ) : undefined
      }
      titleEndContent={
        <Stack direction="row" gap={1}>
          {isImage && (
            <Tooltip placement="top" title="View in fullscreen">
              <Box>
                <GrayToBlueIconButton onClick={() => fullScreenHandle.enter()}>
                  <ArrowUpRightAndArrowDownLeftFromCenterIcon />
                </GrayToBlueIconButton>
              </Box>
            </Tooltip>
          )}
          {!readonly && (
            <Tooltip
              placement="top"
              title={
                isDirty
                  ? "Save or discard your changes to replace the file"
                  : "Replace"
              }
            >
              <Box>
                <GrayToBlueIconButton
                  disabled={isDirty}
                  onClick={() => setReplacing(true)}
                >
                  <RotateRegularIcon />
                </GrayToBlueIconButton>
              </Box>
            </Tooltip>
          )}
          <Tooltip placement="top" title="Download">
            <Box
              component="a"
              download
              href={fileUrl}
              rel="nofollow noopener noreferrer"
            >
              <GrayToBlueIconButton>
                <DownloadRegularIcon />
              </GrayToBlueIconButton>
            </Box>
          </Tooltip>
          <Tooltip placement="top" title="Open in new tab">
            <Box
              component="a"
              href={fileUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <GrayToBlueIconButton>
                <ArrowUpRightFromSquareRegularIcon
                  sx={{ width: 13, height: 13 }}
                />
              </GrayToBlueIconButton>
            </Box>
          </Tooltip>
        </Stack>
      }
    >
      <Stack
        sx={({ boxShadows }) => ({
          alignItems: "center",
          justifyContent: "center",
          boxShadow: boxShadows.sm,
          borderRadius: 1,
          height: isPdf ? "auto" : isFullScreen ? "100%" : previewHeight,
          position: "relative",
        })}
      >
        {replacing ? (
          <ReplaceFile
            close={() => setReplacing(false)}
            description={description}
            displayName={displayName}
            isImage={!!isImage}
          />
        ) : isImage ? (
          <FullScreen
            className="full-height-and-width-for-react-full-screen"
            handle={fullScreenHandle}
          >
            <ImageWithCheckedBackground
              alt={alt}
              isFullScreen={isFullScreen}
              src={fileUrl}
              sx={
                isFullScreen
                  ? {
                      background: ({ palette }) => palette.gray[90],
                      padding: 4,
                      height: "100%",
                    }
                  : { height: previewHeight }
              }
            />
          </FullScreen>
        ) : isPdf ? (
          <PdfPreview
            setShowSearch={setShowSearch}
            showSearch={showSearch}
            showThumbnails={showThumbnails}
            url={fileUrl}
          />
        ) : (
          <Stack alignItems="center" spacing={2}>
            <FileRegularIcon
              sx={{
                color: ({ palette }) => palette.gray[50],
                fontSize: 48,
              }}
            />
            <Typography sx={{ color: ({ palette }) => palette.gray[70] }}>
              {fileName}
            </Typography>
          </Stack>
        )}
      </Stack>
    </SectionWrapper>
  );
};
