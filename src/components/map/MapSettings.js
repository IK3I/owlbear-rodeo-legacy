import React, { useEffect, useState } from "react";
import { Flex, Box, Label, Input, Checkbox, IconButton } from "theme-ui";

import ExpandMoreIcon from "../../icons/ExpandMoreIcon";

import useDebounce from "../../helpers/useDebounce";
import usePrevious from "../../helpers/usePrevious";

function MapSettings({
  map,
  mapState,
  onSettingsChange,
  onStateSettingsChange,
  showMore,
  onShowMoreChange,
}) {
  function handleFlagChange(event, flag) {
    if (event.target.checked) {
      onStateSettingsChange("editFlags", [...mapState.editFlags, flag]);
    } else {
      onStateSettingsChange(
        "editFlags",
        mapState.editFlags.filter((f) => f !== flag)
      );
    }
  }

  // Create a local state for the map name to debounce calls to settings change
  // and avoid performance issues with db access
  const [localMapName, setLocalMapName] = useState("");
  const prevMap = usePrevious(map);
  useEffect(() => {
    // Check map changed
    if (map && (!prevMap || map.id !== prevMap.id)) {
      setLocalMapName(map.name);
    }
  }, [map]);
  const debouncedLocalMapName = useDebounce(localMapName, 100);
  useEffect(() => {
    if (map) {
      onSettingsChange("name", debouncedLocalMapName);
    }
  }, [debouncedLocalMapName]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex>
        <Box mt={2} mr={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridX">Columns</Label>
          <Input
            type="number"
            name="gridX"
            value={(map && map.gridX) || 0}
            onChange={(e) =>
              onSettingsChange("gridX", parseInt(e.target.value))
            }
            disabled={map === null || map.type === "default"}
            min={1}
            my={1}
          />
        </Box>
        <Box mt={2} ml={1} sx={{ flexGrow: 1 }}>
          <Label htmlFor="gridY">Rows</Label>
          <Input
            type="number"
            name="gridY"
            value={(map && map.gridY) || 0}
            onChange={(e) =>
              onSettingsChange("gridY", parseInt(e.target.value))
            }
            disabled={map === null || map.type === "default"}
            min={1}
            my={1}
          />
        </Box>
      </Flex>
      {showMore && (
        <>
          <Box mt={2} sx={{ flexGrow: 1 }}>
            <Label>Allow others to edit</Label>
            <Flex my={1}>
              <Label>
                <Checkbox
                  checked={
                    mapState !== null && mapState.editFlags.includes("drawings")
                  }
                  disabled={mapState === null}
                  onChange={(e) => handleFlagChange(e, "drawings")}
                />
                Drawings
              </Label>
              <Label>
                <Checkbox
                  checked={
                    mapState !== null && mapState.editFlags.includes("tokens")
                  }
                  disabled={mapState === null}
                  onChange={(e) => handleFlagChange(e, "tokens")}
                />
                Tokens
              </Label>
              <Label>
                <Checkbox
                  checked={
                    mapState !== null && mapState.editFlags.includes("map")
                  }
                  disabled={mapState === null}
                  onChange={(e) => handleFlagChange(e, "map")}
                />
                Map
              </Label>
            </Flex>
          </Box>
          <Box my={2} sx={{ flexGrow: 1 }}>
            <Label htmlFor="name">Name</Label>
            <Input
              name="name"
              value={localMapName}
              onChange={(e) => setLocalMapName(e.target.value)}
              disabled={map === null || map.type === "default"}
              my={1}
            />
          </Box>
        </>
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onShowMoreChange(!showMore);
        }}
        sx={{
          transform: `rotate(${showMore ? "180deg" : "0"})`,
          alignSelf: "center",
        }}
        aria-label={showMore ? "Show Less" : "Show More"}
        title={showMore ? "Show Less" : "Show More"}
        disabled={map === null}
      >
        <ExpandMoreIcon />
      </IconButton>
    </Flex>
  );
}

export default MapSettings;
