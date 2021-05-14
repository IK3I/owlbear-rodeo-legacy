import React from "react";
import { Flex, IconButton, Box, Text, Badge, Grid } from "theme-ui";

import EditTileIcon from "../icons/EditTileIcon";

function Tile({
  title,
  isSelected,
  onSelect,
  onEdit,
  onDoubleClick,
  canEdit,
  badges,
  editTitle,
  columns,
  children,
}) {
  return (
    <Flex
      sx={{
        position: "relative",
        width: "100%",
        height: "0",
        paddingTop: "100%",
        borderRadius: "4px",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
        userSelect: "none",
      }}
      bg="background"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={onDoubleClick}
      aria-label={title}
    >
      <Grid
        columns={columns}
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          gridGap: 0,
        }}
      >
        {children}
      </Grid>
      <Flex
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.65) 100%);",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        p={2}
      >
        <Text
          as="p"
          variant="heading"
          color="hsl(210, 50%, 96%)"
          sx={{ textAlign: "center" }}
        >
          {title}
        </Text>
      </Flex>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          borderColor: "primary",
          borderStyle: isSelected ? "solid" : "none",
          borderWidth: "4px",
          pointerEvents: "none",
          borderRadius: "4px",
        }}
      />
      <Box sx={{ position: "absolute", top: 0, left: 0 }}>
        {badges.map((badge, i) => (
          <Badge m={2} key={i} bg="overlay">
            {badge}
          </Badge>
        ))}
      </Box>
      {canEdit && (
        <Box sx={{ position: "absolute", top: 0, right: 0 }}>
          <IconButton
            aria-label={editTitle}
            title={editTitle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            bg="overlay"
            sx={{ borderRadius: "50%" }}
            m={2}
          >
            <EditTileIcon />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
}

Tile.defaultProps = {
  title: "",
  isSelected: false,
  onSelect: () => {},
  onEdit: () => {},
  onDoubleClick: () => {},
  size: "medium",
  canEdit: false,
  badges: [],
  editTitle: "Edit",
  columns: "1fr",
};

export default Tile;
