"use client";

import { Text } from "@react-three/drei";

import { Button3D } from "./Button3D";
import { numberKeyColors, operatorKeyColors, FONT_BOLD, FONT_REGULAR, layout, palette } from "./theme";

const numberValues = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0"];
const operatorValues = ["+", "-", "×", "÷", "(", ")"];

export function NumberPad3D({
  onKeyDown,
  onKeyUp,
  onClear,
}: {
  onKeyDown: (value: string) => void;
  onKeyUp: () => void;
  onClear: () => void;
}) {
  const cols = 3;
  const cellSize = (layout.sidebarRight - layout.sidebarLeft) / cols;
  const btnSize = cellSize * 0.82;
  const top = layout.top - 1.5;

  const cellPosition = (row: number, col: number) => {
    const x = layout.sidebarLeft + cellSize * (col + 0.5);
    const y = top - row * cellSize;
    return [x, y, 0] as [number, number, number];
  };

  return (
    <group>
      <Text
        font={FONT_REGULAR}
        fontSize={0.2}
        color={palette.purpleText}
        anchorX="left"
        anchorY="middle"
        position={[layout.sidebarLeft, layout.top - 0.35, 0.3]}
      >
        입력 패드
      </Text>
      <Text
        font={FONT_BOLD}
        fontSize={0.34}
        color={palette.ink}
        anchorX="left"
        anchorY="middle"
        position={[layout.sidebarLeft, layout.top - 0.75, 0.3]}
      >
        버튼 입력
      </Text>

      {numberValues.map((value, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const style = numberKeyColors[index];

        return (
          <Button3D
            key={value}
            label={value}
            width={btnSize}
            height={btnSize}
            radius={btnSize / 2}
            color={style.color}
            shadowColor={style.shadow}
            textColor={style.text}
            fontSize={btnSize * 0.42}
            position={cellPosition(row, col)}
            onPointerDown={() => onKeyDown(value)}
            onPointerUp={onKeyUp}
            onPointerLeave={onKeyUp}
          />
        );
      })}

      <Button3D
        label="DEL"
        width={btnSize}
        height={btnSize}
        radius={btnSize / 2}
        color={palette.yellow}
        shadowColor={palette.yellowShadow}
        textColor={palette.ink}
        fontSize={btnSize * 0.4}
        position={cellPosition(3, 1)}
        onPointerDown={() => onKeyDown("DEL")}
        onPointerUp={onKeyUp}
        onPointerLeave={onKeyUp}
      />
      <Button3D
        label="AC"
        width={btnSize}
        height={btnSize}
        radius={btnSize / 2}
        color={palette.red}
        shadowColor={palette.redShadow}
        textColor="#ffffff"
        fontSize={btnSize * 0.4}
        position={cellPosition(3, 2)}
        onClick={onClear}
      />

      {operatorValues.map((value, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const style = operatorKeyColors[index];
        const position = cellPosition(row + 4.6, col);

        return (
          <Button3D
            key={value}
            label={value}
            width={btnSize}
            height={btnSize}
            radius={btnSize / 2}
            color={style.color}
            shadowColor={style.shadow}
            textColor={style.text}
            fontSize={btnSize * 0.38}
            position={position}
            onPointerDown={() => onKeyDown(value)}
            onPointerUp={onKeyUp}
            onPointerLeave={onKeyUp}
          />
        );
      })}
    </group>
  );
}
