/**
 * groupActions.ts
 * Group and ungroup operations for slide elements.
 *
 * A GroupElement wraps a set of childIds. Visually the group's bounding box
 * is computed from its children. The children remain in the elements array
 * and are rendered normally; the group element is an invisible container
 * used for coordinated transforms.
 */

import type { SlideElement, GroupElement } from '@/types/elements'
import { makeId } from '@/types/elements'
import { getGroupBBox, toRect } from './mathUtils'

// ─── Group ────────────────────────────────────────────────────────────────────

/**
 * Wrap the given selectedIds in a new GroupElement.
 * The group element is inserted at the position of the topmost selected element.
 * Returns the updated elements array.
 */
export function groupElements(
  elements: SlideElement[],
  selectedIds: string[],
): SlideElement[] {
  if (selectedIds.length < 2) return elements

  const selected = elements.filter(e => selectedIds.includes(e.id))
  if (selected.length < 2) return elements

  const bbox = getGroupBBox(selected.map(toRect))

  const group: GroupElement = {
    id: makeId(),
    type: 'group',
    x: bbox.x,
    y: bbox.y,
    width:  bbox.width,
    height: bbox.height,
    childIds: selected.map(e => e.id),
  }

  // Insert the group element just above the highest-index selected element
  const highestIdx = Math.max(...selectedIds.map(id => elements.findIndex(e => e.id === id)))
  const copy = [...elements]
  copy.splice(highestIdx + 1, 0, group)
  return copy
}

// ─── Ungroup ──────────────────────────────────────────────────────────────────

/**
 * Remove the group element (but keep all its children).
 * Returns the updated elements array and the IDs of the ungrouped children.
 */
export function ungroupElements(
  elements: SlideElement[],
  groupId: string,
): { elements: SlideElement[]; childIds: string[] } {
  const group = elements.find(e => e.id === groupId)
  if (!group || group.type !== 'group') return { elements, childIds: [] }

  const childIds = (group as GroupElement).childIds
  return {
    elements: elements.filter(e => e.id !== groupId),
    childIds,
  }
}

// ─── Group bounding box ────────────────────────────────────────────────────────

/**
 * Compute the current bounding box of a group from its children's positions.
 */
export function getGroupElementBBox(
  elements: SlideElement[],
  group: GroupElement,
) {
  const children = elements.filter(e => group.childIds.includes(e.id))
  return getGroupBBox(children.map(toRect))
}
