"use client";

import { CardButton3D } from "./CardButton3D";
import { layout } from "./theme";

export type ChoiceGridItem = {
  key: string;
  badgeLabel: string;
  badgeColor: string;
  badgeTextColor?: string;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
};

const contentTop = layout.top - 1.35;
const contentBottom = layout.bottom + 1.75;
const contentLeft = layout.stageLeft + 0.25;
const contentRight = layout.stageRight - 0.25;

export function ChoiceGrid3D({ items, columns = 2 }: { items: ChoiceGridItem[]; columns?: number }) {
  const contentWidth = contentRight - contentLeft;
  const contentHeight = contentTop - contentBottom;
  const rows = Math.ceil(items.length / columns);
  const gap = 0.3;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const rawCardHeight = (contentHeight - gap * (rows - 1)) / rows;
  const cardHeight = Math.min(rawCardHeight, 2.1);
  const gridHeight = rows * cardHeight + (rows - 1) * gap;
  const startY = contentTop - (contentHeight - gridHeight) / 2 - cardHeight / 2;

  return (
    <group>
      {items.map((item, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const itemsInRow = row === rows - 1 ? items.length - row * columns : columns;
        const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gap;
        const rowStartX = contentLeft + (contentWidth - rowWidth) / 2 + cardWidth / 2;
        const x = rowStartX + col * (cardWidth + gap);
        const y = startY - row * (cardHeight + gap);

        return (
          <CardButton3D
            key={item.key}
            width={cardWidth}
            height={cardHeight}
            position={[x, y, 0]}
            badgeLabel={item.badgeLabel}
            badgeColor={item.badgeColor}
            badgeTextColor={item.badgeTextColor}
            title={item.title}
            subtitle={item.subtitle}
            selected={item.selected}
            onClick={item.onClick}
          />
        );
      })}
    </group>
  );
}
