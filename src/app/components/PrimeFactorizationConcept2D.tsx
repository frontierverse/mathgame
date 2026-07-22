"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import styles from "./PrimeFactorizationConcept2D.module.css";

const DESKTOP_WIDTH = 720;
const DESKTOP_HEIGHT = 450;
const COMPACT_WIDTH = 360;
const COMPACT_HEIGHT = 525;

type FactorTreeNode = {
  id: string;
  value: number;
  left?: FactorTreeNode;
  right?: FactorTreeNode;
  depth: number;
  x: number;
  y: number;
  isPrime: boolean;
};

type PrimeFactorizationConcept2DProps = {
  value: number;
};

function splitValue(value: number) {
  if (value <= 1) return null;

  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return [divisor, value / divisor] as const;
  }

  return null;
}

function buildTree(value: number, id = "root", depth = 0): FactorTreeNode {
  const split = splitValue(value);
  const node: FactorTreeNode = {
    id,
    value,
    depth,
    x: 0,
    y: 0,
    isPrime: value > 1 && split === null,
  };

  if (split) {
    node.left = buildTree(split[0], `${id}-l`, depth + 1);
    node.right = buildTree(split[1], `${id}-r`, depth + 1);
  }

  return node;
}

function leafCount(node: FactorTreeNode): number {
  if (!node.left || !node.right) return 1;
  return leafCount(node.left) + leafCount(node.right);
}

function maxDepth(node: FactorTreeNode): number {
  if (!node.left || !node.right) return node.depth;
  return Math.max(maxDepth(node.left), maxDepth(node.right));
}

function splitIds(node: FactorTreeNode): string[] {
  if (!node.left || !node.right) return [];
  return [node.id, ...splitIds(node.left), ...splitIds(node.right)];
}

function assignPositions(
  root: FactorTreeNode,
  compactLayout: boolean,
): FactorTreeNode[] {
  const width = compactLayout ? COMPACT_WIDTH : DESKTOP_WIDTH;
  const height = compactLayout ? COMPACT_HEIGHT : DESKTOP_HEIGHT;
  const leaves = leafCount(root);
  const depth = Math.max(maxDepth(root), 1);
  const leafGap = Math.min(
    compactLayout ? 72 : 130,
    (width - (compactLayout ? 80 : 180)) / Math.max(leaves - 1, 1),
  );
  const firstLeafX = width / 2 - ((leaves - 1) * leafGap) / 2;
  const topY = compactLayout ? 62 : 72;
  const treeBottom = compactLayout ? height - 135 : 300;
  const depthGap = (treeBottom - topY) / depth;
  let nextLeaf = 0;
  const positioned: FactorTreeNode[] = [];

  const visit = (node: FactorTreeNode): FactorTreeNode => {
    const nextNode = { ...node };

    if (!node.left || !node.right) {
      nextNode.x = firstLeafX + nextLeaf * leafGap;
      nextLeaf += 1;
    } else {
      nextNode.left = visit(node.left);
      nextNode.right = visit(node.right);
      nextNode.x = (nextNode.left.x + nextNode.right.x) / 2;
    }

    nextNode.y = topY + node.depth * depthGap;
    positioned.push(nextNode);
    return nextNode;
  };

  visit(root);
  return positioned;
}

function factorsForState(node: FactorTreeNode, expanded: Set<string>): number[] {
  if (!node.left || !node.right || !expanded.has(node.id)) return [node.value];
  return [
    ...factorsForState(node.left, expanded),
    ...factorsForState(node.right, expanded),
  ];
}

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToCompactLayout(onChange: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getCompactLayoutSnapshot() {
  return window.matchMedia("(max-width: 640px)").matches;
}

export default function PrimeFactorizationConcept2D({
  value,
}: PrimeFactorizationConcept2DProps) {
  const compactLayout = useSyncExternalStore(
    subscribeToCompactLayout,
    getCompactLayoutSnapshot,
    () => false,
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const tree = useMemo(() => buildTree(value), [value]);
  const nodes = useMemo(
    () => assignPositions(tree, compactLayout),
    [compactLayout, tree],
  );
  const steps = splitIds(tree);
  const stepCount = steps.length;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || stepCount === 0) return;

    const timers = Array.from({ length: stepCount }, (_, index) =>
      window.setTimeout(
        () => setStepIndex(index + 1),
        (index + 1) * 1700,
      ),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [prefersReducedMotion, stepCount]);

  const activeStep = prefersReducedMotion ? stepCount : stepIndex;
  const expanded = new Set(steps.slice(0, activeStep));
  const visibleNodes = new Set<string>([tree.id]);
  const visibleConnectors = new Set<string>();

  nodes.forEach((node) => {
    if (!node.left || !node.right || !expanded.has(node.id)) return;
    visibleNodes.add(node.left.id);
    visibleNodes.add(node.right.id);
    visibleConnectors.add(`${node.id}-${node.left.id}`);
    visibleConnectors.add(`${node.id}-${node.right.id}`);
  });

  const factors = factorsForState(tree, expanded);
  const equation =
    factors.length === 1
      ? `${value} = ${factors[0]}`
      : `${value} = ${factors.join(" × ")}`;
  const factorsArePrime = value > 1 && factors.every((factor) => splitValue(factor) === null);
  const width = compactLayout ? COMPACT_WIDTH : DESKTOP_WIDTH;
  const height = compactLayout ? COMPACT_HEIGHT : DESKTOP_HEIGHT;
  const nodeRadius = compactLayout ? 22 : 25;

  return (
    <div className={styles.scene} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          {nodes.flatMap((node) => {
            if (!node.left || !node.right) return [];

            return [node.left, node.right].map((child) => {
              const connectorId = `${node.id}-${child.id}`;
              return (
                <line
                  key={connectorId}
                  className={
                    visibleConnectors.has(connectorId)
                      ? styles.connector
                      : styles.connectorFuture
                  }
                  x1={node.x}
                  y1={node.y}
                  x2={child.x}
                  y2={child.y}
                />
              );
            });
          })}
        </g>

        {nodes.map((node) => {
          const visible = visibleNodes.has(node.id);
          const className = node.id === tree.id
            ? styles.nodeRoot
            : node.isPrime
              ? styles.nodePrime
              : styles.node;

          return (
            <g
              key={node.id}
              className={visible ? className : styles.nodeFuture}
              transform={`translate(${node.x} ${node.y})`}
            >
              <circle r={nodeRadius} />
              <text textAnchor="middle" dominantBaseline="central">
                {node.value}
              </text>
            </g>
          );
        })}

        <text
          key={`equation-${activeStep}`}
          className={`${styles.equation} ${
            factorsArePrime ? styles.equationPrime : styles.equationComposite
          }`}
          x={width / 2}
          y={compactLayout ? 450 : 368}
          textAnchor="middle"
        >
          {equation}
        </text>

        <text
          className={styles.factorLabel}
          x={width / 2}
          y={compactLayout ? 486 : 410}
          textAnchor="middle"
        >
          {factorsArePrime ? "소수" : ""}
        </text>
      </svg>
    </div>
  );
}
