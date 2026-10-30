// Radial layout for the resource mindmap: a hub in the middle, branches on an
// inner ring, leaves on an outer ring. Each branch owns a slice of the circle
// sized to its leaf count, and its leaves stay inside that slice, so nodes from
// neighbouring branches never overlap.

export const MINDMAP_SIZE = { width: 1100, height: 760 } as const;

const BRANCH_RADIUS = { x: 250, y: 185 };
const LEAF_RADIUS = { x: 460, y: 325 };

export type MindmapGroup = { id: string; leafIds: string[] };
export type Point = { x: number; y: number };

export type MindmapLayout = {
  center: Point;
  branches: Map<string, Point>;
  leaves: Map<string, Point>;
};

export const computeMindmapLayout = (groups: MindmapGroup[]): MindmapLayout => {
  const center = { x: MINDMAP_SIZE.width / 2, y: MINDMAP_SIZE.height / 2 };
  const branches = new Map<string, Point>();
  const leaves = new Map<string, Point>();
  if (groups.length === 0) return { center, branches, leaves };

  const slotsOf = (g: MindmapGroup) => Math.max(1, g.leafIds.length);
  const totalSlots = groups.reduce((sum, g) => sum + slotsOf(g), 0);
  const slot = (2 * Math.PI) / totalSlots;
  // Start so the first branch is centred at the top.
  let cursor = -Math.PI / 2 - (slotsOf(groups[0]) * slot) / 2;

  for (const group of groups) {
    const start = cursor;
    cursor += slotsOf(group) * slot;
    const angle = start + (slotsOf(group) * slot) / 2;
    branches.set(group.id, {
      x: center.x + Math.cos(angle) * BRANCH_RADIUS.x,
      y: center.y + Math.sin(angle) * BRANCH_RADIUS.y,
    });
    group.leafIds.forEach((leafId, i) => {
      const leafAngle = start + (i + 0.5) * slot;
      leaves.set(leafId, {
        x: center.x + Math.cos(leafAngle) * LEAF_RADIUS.x,
        y: center.y + Math.sin(leafAngle) * LEAF_RADIUS.y,
      });
    });
  }

  return { center, branches, leaves };
};

/** Absolute-position styles for a straight line between two points. */
export const lineStyle = (from: Point, to: Point, thickness: number): React.CSSProperties => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    left: from.x,
    top: from.y - thickness / 2,
    width: Math.hypot(dx, dy),
    height: thickness,
    transform: `rotate(${Math.atan2(dy, dx)}rad)`,
  };
};
