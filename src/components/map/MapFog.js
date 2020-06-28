import React, { useContext, useState, useEffect, useCallback } from "react";
import shortid from "shortid";
import { Group } from "react-konva";
import useImage from "use-image";

import diagonalPattern from "../../images/DiagonalPattern.png";

import MapInteractionContext from "../../contexts/MapInteractionContext";
import MapStageContext from "../../contexts/MapStageContext";

import { compare as comparePoints } from "../../helpers/vector2";
import {
  getBrushPositionForTool,
  simplifyPoints,
  getStrokeWidth,
} from "../../helpers/drawing";
import colors from "../../helpers/colors";
import {
  HoleyLine,
  getRelativePointerPositionNormalized,
  Tick,
} from "../../helpers/konva";

function MapFog({
  shapes,
  onShapeAdd,
  onShapeSubtract,
  onShapesRemove,
  onShapesEdit,
  selectedToolId,
  selectedToolSettings,
  gridSize,
}) {
  const { stageScale, mapWidth, mapHeight, interactionEmitter } = useContext(
    MapInteractionContext
  );
  const mapStageRef = useContext(MapStageContext);
  const [drawingShape, setDrawingShape] = useState(null);
  const [isBrushDown, setIsBrushDown] = useState(false);
  const [editingShapes, setEditingShapes] = useState([]);

  const isEditing = selectedToolId === "fog";
  const shouldHover =
    isEditing &&
    (selectedToolSettings.type === "toggle" ||
      selectedToolSettings.type === "remove");

  const [patternImage] = useImage(diagonalPattern);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const mapStage = mapStageRef.current;

    function getBrushPosition() {
      const mapImage = mapStage.findOne("#mapImage");
      return getBrushPositionForTool(
        getRelativePointerPositionNormalized(mapImage),
        selectedToolId,
        selectedToolSettings,
        gridSize,
        shapes
      );
    }

    function handleBrushDown() {
      const brushPosition = getBrushPosition();
      if (selectedToolSettings.type === "brush") {
        setDrawingShape({
          type: "fog",
          data: {
            points: [brushPosition],
            holes: [],
          },
          strokeWidth: 0.5,
          color: selectedToolSettings.useFogSubtract ? "red" : "black",
          blend: false,
          id: shortid.generate(),
          visible: true,
        });
      }
      setIsBrushDown(true);
    }

    function handleBrushMove() {
      if (
        selectedToolSettings.type === "brush" &&
        isBrushDown &&
        drawingShape
      ) {
        const brushPosition = getBrushPosition();
        setDrawingShape((prevShape) => {
          const prevPoints = prevShape.data.points;
          if (
            comparePoints(
              prevPoints[prevPoints.length - 1],
              brushPosition,
              0.001
            )
          ) {
            return prevShape;
          }
          return {
            ...prevShape,
            data: {
              ...prevShape.data,
              points: [...prevPoints, brushPosition],
            },
          };
        });
      }
    }

    function handleBrushUp() {
      if (selectedToolSettings.type === "brush" && drawingShape) {
        const subtract = selectedToolSettings.useFogSubtract;

        if (drawingShape.data.points.length > 1) {
          let shapeData = {};
          if (subtract) {
            shapeData = { id: drawingShape.id, type: drawingShape.type };
          } else {
            shapeData = { ...drawingShape, color: "black" };
          }
          const shape = {
            ...shapeData,
            data: {
              ...drawingShape.data,
              points: simplifyPoints(
                drawingShape.data.points,
                gridSize,
                // Downscale fog as smoothing doesn't currently work with edge snapping
                stageScale / 2
              ),
            },
          };
          if (subtract) {
            onShapeSubtract(shape);
          } else {
            onShapeAdd(shape);
          }
        }
        setDrawingShape(null);
      }

      // Erase
      if (editingShapes.length > 0) {
        if (selectedToolSettings.type === "remove") {
          onShapesRemove(editingShapes.map((shape) => shape.id));
        } else if (selectedToolSettings.type === "toggle") {
          onShapesEdit(
            editingShapes.map((shape) => ({
              ...shape,
              visible: !shape.visible,
            }))
          );
        }
        setEditingShapes([]);
      }

      setIsBrushDown(false);
    }

    function handlePolygonClick() {
      if (selectedToolSettings.type === "polygon") {
        const brushPosition = getBrushPosition();
        setDrawingShape((prevDrawingShape) => {
          if (prevDrawingShape) {
            return {
              ...prevDrawingShape,
              data: {
                ...prevDrawingShape.data,
                points: [...prevDrawingShape.data.points, brushPosition],
              },
            };
          } else {
            return {
              type: "fog",
              data: {
                points: [brushPosition, brushPosition],
                holes: [],
              },
              strokeWidth: 0.5,
              color: selectedToolSettings.useFogSubtract ? "red" : "black",
              blend: false,
              id: shortid.generate(),
              visible: true,
            };
          }
        });
      }
    }

    function handlePolygonMove() {
      if (selectedToolSettings.type === "polygon" && drawingShape) {
        const brushPosition = getBrushPosition();
        setDrawingShape((prevShape) => {
          if (!prevShape) {
            return;
          }
          return {
            ...prevShape,
            data: {
              ...prevShape.data,
              points: [...prevShape.data.points.slice(0, -1), brushPosition],
            },
          };
        });
      }
    }

    interactionEmitter.on("dragStart", handleBrushDown);
    interactionEmitter.on("drag", handleBrushMove);
    interactionEmitter.on("dragEnd", handleBrushUp);
    // Use mouse events for polygon and erase to allow for single clicks
    mapStage.on("mousedown touchstart", handlePolygonMove);
    mapStage.on("mousemove touchmove", handlePolygonMove);
    mapStage.on("click tap", handlePolygonClick);

    return () => {
      interactionEmitter.off("dragStart", handleBrushDown);
      interactionEmitter.off("drag", handleBrushMove);
      interactionEmitter.off("dragEnd", handleBrushUp);
      mapStage.off("mousedown touchstart", handlePolygonMove);
      mapStage.off("mousemove touchmove", handlePolygonMove);
      mapStage.off("click tap", handlePolygonClick);
    };
  }, [
    mapStageRef,
    isEditing,
    drawingShape,
    editingShapes,
    gridSize,
    isBrushDown,
    onShapeAdd,
    onShapeSubtract,
    onShapesEdit,
    onShapesRemove,
    selectedToolId,
    selectedToolSettings,
    shapes,
    stageScale,
    interactionEmitter,
  ]);

  const finishDrawingPolygon = useCallback(() => {
    const subtract = selectedToolSettings.useFogSubtract;
    const data = {
      ...drawingShape.data,
      // Remove the last point as it hasn't been placed yet
      points: drawingShape.data.points.slice(0, -1),
    };
    if (subtract) {
      onShapeSubtract({
        id: drawingShape.id,
        type: drawingShape.type,
        data: data,
      });
    } else {
      onShapeAdd({ ...drawingShape, data: data, color: "black" });
    }

    setDrawingShape(null);
  }, [selectedToolSettings, drawingShape, onShapeSubtract, onShapeAdd]);

  // Add keyboard shortcuts
  useEffect(() => {
    function handleKeyDown({ key }) {
      if (
        key === "Enter" &&
        selectedToolSettings.type === "polygon" &&
        drawingShape
      ) {
        finishDrawingPolygon();
      }
      if (key === "Escape" && drawingShape) {
        setDrawingShape(null);
      }
      if (key === "Alt" && drawingShape) {
        updateShapeColor();
      }
    }

    function handleKeyUp({ key }) {
      if (key === "Alt" && drawingShape) {
        updateShapeColor();
      }
    }

    function updateShapeColor() {
      setDrawingShape((prevShape) => {
        if (!prevShape) {
          return;
        }
        return {
          ...prevShape,
          color: selectedToolSettings.useFogSubtract ? "black" : "red",
        };
      });
    }

    interactionEmitter.on("keyDown", handleKeyDown);
    interactionEmitter.on("keyUp", handleKeyUp);
    return () => {
      interactionEmitter.off("keyDown", handleKeyDown);
      interactionEmitter.off("keyUp", handleKeyUp);
    };
  }, [
    finishDrawingPolygon,
    interactionEmitter,
    drawingShape,
    selectedToolSettings,
  ]);

  function handleShapeOver(shape, isDown) {
    if (shouldHover && isDown) {
      if (editingShapes.findIndex((s) => s.id === shape.id) === -1) {
        setEditingShapes((prevShapes) => [...prevShapes, shape]);
      }
    }
  }

  function reducePoints(acc, point) {
    return [...acc, point.x * mapWidth, point.y * mapHeight];
  }

  function renderShape(shape) {
    const points = shape.data.points.reduce(reducePoints, []);
    const holes =
      shape.data.holes &&
      shape.data.holes.map((hole) => hole.reduce(reducePoints, []));
    return (
      <HoleyLine
        key={shape.id}
        onMouseMove={() => handleShapeOver(shape, isBrushDown)}
        onTouchOver={() => handleShapeOver(shape, isBrushDown)}
        onMouseDown={() => handleShapeOver(shape, true)}
        onTouchStart={() => handleShapeOver(shape, true)}
        points={points}
        stroke={colors[shape.color] || shape.color}
        fill={colors[shape.color] || shape.color}
        closed
        lineCap="round"
        strokeWidth={getStrokeWidth(
          shape.strokeWidth,
          gridSize,
          mapWidth,
          mapHeight
        )}
        visible={isEditing || shape.visible}
        opacity={isEditing ? 0.5 : 1}
        fillPatternImage={patternImage}
        fillPriority={isEditing && !shape.visible ? "pattern" : "color"}
        holes={holes}
      />
    );
  }

  function renderEditingShape(shape) {
    const editingShape = {
      ...shape,
      color: "#BB99FF",
    };
    return renderShape(editingShape);
  }

  function renderPolygonAcceptTick(shape) {
    if (shape.data.points.length === 0) {
      return null;
    }
    const isCross = shape.data.points.length < 4;
    return (
      <Tick
        x={shape.data.points[0].x * mapWidth}
        y={shape.data.points[0].y * mapHeight}
        scale={1 / stageScale}
        cross={isCross}
        onClick={(e) => {
          e.cancelBubble = true;
          if (isCross) {
            setDrawingShape(null);
          } else {
            finishDrawingPolygon();
          }
        }}
      />
    );
  }

  return (
    <Group>
      {shapes.map(renderShape)}
      {drawingShape && renderShape(drawingShape)}
      {drawingShape &&
        selectedToolSettings &&
        selectedToolSettings.type === "polygon" &&
        renderPolygonAcceptTick(drawingShape)}
      {editingShapes.length > 0 && editingShapes.map(renderEditingShape)}
    </Group>
  );
}

export default MapFog;