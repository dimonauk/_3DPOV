"use client";

/**
 * components/three/print-bar-3d-plate.tsx — Reusable 3D plate primitives.
 *
 * `Plate` is the main four-tab toolbar plate (material / scale / finish /
 * action). `OptionPlate` is the smaller plate that appears stacked above
 * a main plate when it's hovered (the "dropdown" effect). Both are
 * extruded RoundedBoxes with drei Text labels and standard pointer-event
 * handlers.
 */

import { RoundedBox, Text } from "@react-three/drei";
import { useState } from "react";

import { COLOUR } from "./print-bar-shared";

export function Plate({
  x,
  label,
  value,
  open,
  accent,
  onHover,
  onLeave,
  onClick,
  children,
}: {
  x: number;
  label: string;
  value: string;
  open: boolean;
  accent?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const baseColour = accent
    ? open || hovered
      ? COLOUR.plateSelected
      : "#33222a"
    : open || hovered
      ? COLOUR.plateHover
      : COLOUR.plate;
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox
        args={[1.45, 0.55, 0.12]}
        radius={0.06}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshStandardMaterial
          color={baseColour}
          metalness={0.85}
          roughness={0.25}
          emissive={accent && hovered ? COLOUR.accentCyan : "#000000"}
          emissiveIntensity={accent && hovered ? 0.35 : 0}
        />
      </RoundedBox>
      <Text
        position={[0, 0.12, 0.07]}
        fontSize={0.07}
        color={COLOUR.textDim}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, -0.08, 0.07]}
        fontSize={0.11}
        color={COLOUR.text}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.3}
      >
        {value}
      </Text>
      {children}
    </group>
  );
}

export function OptionPlate({
  y,
  label,
  selected,
  onSelect,
}: {
  y: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={[0, y, 0.01]}>
      <RoundedBox
        args={[1.35, 0.38, 0.08]}
        radius={0.04}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={
            selected
              ? COLOUR.plateSelected
              : hovered
                ? COLOUR.plateHover
                : COLOUR.plate
          }
          metalness={0.7}
          roughness={0.35}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.09}
        color={selected ? "#1a1a22" : COLOUR.text}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {label}
      </Text>
    </group>
  );
}
