export { CHILDREN, DESCENDANT_COUNT } from "./subtotal.js";
import { subtotal, GROUP, IMPACT, INDEX, LEVEL, PARENT, RANK, SURPRISE } from "./subtotal.js";
export { GROUP, IMPACT, INDEX, LEVEL, PARENT, RANK, SURPRISE };
export const NODE = Symbol("NODE");
export const OPEN = Symbol("OPEN");
export const SHOWN = Symbol("SHOWN");

// Store event listeners for each tree
const listeners = new WeakMap();

/**
 * Renders a hierarchical tree based on the provided data and configuration.
 *
 * This function calculates a tree data structure based on the input data and configuration,
 * then renders the tree into the specified DOM element. It also provides interactivity
 * to expand or collapse nodes upon user clicks.
 *
 * @function
 * @param {string} selector - The CSS selector of the DOM element where the tree will be rendered.
 * @param {Object} options - Configuration for the tree rendering and interaction.
 * @param {Object[]} options.data - An array of objects representing the data rows.
 * @param {(string[]|Object)} options.groups - Defines the hierarchy levels of the tree.
 * @param {(string[]|Object)} options.metrics - Specifies the metrics to aggregate.
 * @param {string|Object} [options.sort] - Defines the sorting criteria for each level.
 * @param {string|function} [options.impact] - Specifies the impact metric to rank insights by.
 * @param {function} [options.render=tableRender] - A function to render the tree.
 * @param {string} [options.totalGroup="Total"] - Name of the total row's `GROUP`.
 *
 * @returns {Object} - Returns an object with methods to interact with the rendered tree. Includes
 *    - `.tree` - The calculated tree data structure.
 *    - `.update()` - Method to update the tree.
 *    - `.toggle()` - Method to toggle nodes' expansion or collapse state.
 *    - `.show()` - Method to show/hide nodes based on a rule.
 *    - `.classed()` - Method to set class on each node
 *
 * @example
 * const tree = insightTree("#myTree", {
 *   data: [...],
 *   groups: ["a", "b"],
 *   metrics: ["x", "y"],
 *   sort: "+x",
 *   impact: "x"
 * });
 *
 * @throws {Error} Throws an error if the provided selector does not match any DOM element.
 */
export function insightTree(
  selector,
  { data, groups, metrics, sort, impact, rankBy, totalGroup, render = tableRender },
) {
  // Calculate the tree data structure
  const tree = subtotal({ data, groups, metrics, sort, impact, rankBy: rankBy, totalGroup });
  // Compute all leaves sorted by RANK
  const leaves = tree
    .map((node, i) => (i === tree.length - 1 || tree[i + 1][LEVEL] <= node[LEVEL] ? { i, rank: node[RANK] } : null))
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)
    .map((leaf) => leaf.i);
  const insightTree = { tree, leaves };
  // Render the tree
  let el = document.querySelector(selector);
  if (!el) throw new Error(`selector ${selector} missing`);
  render(el, { tree, selector, data, groups, metrics, sort, impact, rankBy, totalGroup });
  // Map nodes to tree and vice versa using data-insight-index="${i}" and [NODE]
  const nodes = el.querySelectorAll("[data-insight-level]");
  if (nodes.length == tree.length)
    for (let i = 0; i < tree.length; i++) {
      tree[i][NODE] = nodes[i];
      nodes[i].dataset.insightIndex = i;
    }
  else
    console.error(
      `insightTree: render() generated ${nodes.length} nodes with [data-insight-level]. Expected ${tree.length}`,
    );
  // Bind methods
  insightTree.show = show.bind(el, insightTree);
  insightTree.classed = classed.bind(el, insightTree);
  insightTree.update = update.bind(el, insightTree);
  insightTree.updateLeaf = updateLeaf.bind(el, insightTree);
  insightTree.toggle = toggle.bind(el, insightTree);
  // Listen to clicks and expand/collapse nodes
  function listener(e) {
    // Find the node that was clicked
    const node = e.target.closest("[data-insight-level]");
    if (node) insightTree.toggle(node);
  }
  // Remove previous listener if any
  if (listeners.has(el)) {
    el.removeEventListener("click", listeners.get(el));
    listeners.delete(el);
  }
  // Add new listener
  el.addEventListener("click", listener);
  listeners.set(el, listener);
  return insightTree;
}

/**
 * Toggles the expansion or collapse state of the specified node.
 *
 * If `force` is not provided, toggles the node.
 * `force=true` expands the node.
 * `force=false` collapses the node.
 *
 * Uses `data-insight-level` to determine levels.
 * After toggling, it also toggles the visibility of all child nodes.
 * Direct children are shown/hidden based when the node is expanded/collapsed.
 * Grandchildren and below are always hidden.
 *
 * @function
 * @param {Object} insightTree - insightTree object
 * @param {HTMLElement} node - The DOM node to be toggled.
 * @param {boolean?} [force] - `true` expands node. `false` collapses node. If skipped, toggles node.
 *
 * @example
 * // Toggle the root node
 * toggle(treeData, document.querySelector("[data-insight-level=0]"));
 * // Expand the root node
 * toggle(treeData, document.querySelector("[data-insight-level=0]"), true);
 * // Collapse the root node
 * toggle(treeData, document.querySelector("[data-insight-level=0]"), false);
 *
 * @returns {insightTree} - Returns the insightTree object.
 */
function toggle(insightTree, node, force) {
  const { tree } = insightTree;
  // Find the index of the node in the list of nodes
  let i = +node.dataset.insightIndex;
  // Toggle the node
  const nodeLevel = tree[i][LEVEL];
  if (force === undefined || force === null) force = node.classList.contains("insight-closed");
  node.classList.toggle("insight-closed", !force);
  // Toggle all child nodes
  for (let j = i + 1; j < tree.length && tree[j][LEVEL] > nodeLevel; j++) {
    tree[j][NODE].classList.toggle("insight-hidden", !force || tree[j][LEVEL] > nodeLevel + 1);
    tree[j][NODE].classList.toggle("insight-closed", true);
  }
  return insightTree;
}

/**
 * Filters the tree nodes based on a specified rule, expanding or collapsing each node accordingly.
 *
 * Uses `data-insight-level` to determine levels.
 * Applies the filter function to each node and expands the row if it returns `true`, else collapses it.
 * The filter function receives two parameters:
 * - `row`: The node object with properties like `LEVEL`, `RANK`, `GROUP`, and all group keys for the row.
 * - `node`: The DOM node corresponding to the row.
 *
 * @function
 * @param {Object} insightTree - insightTree object
 * @param {function(Object, HTMLElement): boolean} filter - function(row, node) that returns true/false to expand/collapse node
 * @param {Object} [options] - display options
 * @param {boolean} [options.openAncestors=true] - If true, opens all ancestors of the shown nodes.
 * @param {boolean} [options.showSiblings=false] - If true, shows all siblings of the shown nodes.
 * @param {string} [options.hiddenClass="insight-hidden"] - The CSS class to apply to hidden nodes.
 * @param {string} [options.closedClass="insight-closed"] - The CSS class to apply to closed nodes.
 *
 * @example
 * // Assuming the DOM has nodes with `data-insight-level` attribute and a corresponding tree data structure.
 * show(treeData, (row) => row[LEVEL] == 0 || row[GROUP] == 'Bonn');
 *
 * @returns {insightTree} - Returns the insightTree object.
 */
function show(insightTree, filter, options = {}) {
  const {
    openAncestors = true,
    showSiblings = false,
    hiddenClass = "insight-hidden",
    closedClass = "insight-closed",
  } = options;
  const { tree } = insightTree;
  // Close all nodes to start with
  tree.forEach((row) => (row[OPEN] = false));
  // Show all nodes from filter. Open their parents
  tree.forEach((row) => {
    row[SHOWN] = filter(row, row[NODE]);
    if (row[SHOWN] && openAncestors)
      for (let parent = row[PARENT]; parent; parent = parent[PARENT]) parent[OPEN] = true;
  });
  // Show siblings of shown or open nodes
  if (showSiblings)
    tree.forEach((row) => {
      if (row[SHOWN] || row[OPEN]) tree.forEach((v, j) => (tree[j][SHOWN] |= v[PARENT] === row[PARENT]));
    });
  // Hide nodes that are not shown / open. Add closedClass to closed nodes
  tree.forEach((row) => {
    row[NODE].classList.toggle(hiddenClass, !row[SHOWN] && !row[OPEN]);
    row[NODE].classList.toggle(closedClass, !row[OPEN]);
  });
  return insightTree;
}

function classed(insightTree, className, filter) {
  insightTree.tree.map((row, i) => row[NODE].classList.toggle(className, filter(row, i)));
  return insightTree;
}

/**
 * Updates the visibility and styling of tree nodes based on the specified rank and level criteria.
 *
 * Uses `data-insight-level` and `data-insight-rank` of the nodes to determine levels and ranks.
 *
 * - Nodes with a `rank == options.rank` will have `".insight-current"`.
 * - Nodes with a `rank <= options.rank` will have `".insight-highlight"` (if exactRank=true).
 * - Nodes will be shown if
 *    - `rank <= options.rank` (or `rank == options.rank` if `exactRank=false`), OR
 *    - `level <= options.level`, OR
 *   - they have a child node that meets the rank criteria.
 * - Closed nodes (without a child that meets the rank criteria) will have `".insight-closed"`.
 *
 * @function
 * @param {Object} insightTree - insightTree object
 * @param {Object} criteria - The criteria for updating the tree nodes.
 * @param {number} [criteria.rank] - The rank criteria. Nodes with rank <= options.rank will be highlighted (or rank == options.rank if exactRank=true).
 * @param {number} [criteria.level] - The level criteria. Nodes with level <= options.value will be shown.
 * @param {Object} [options] - display options
 * @param {Object} [options.leaf] - If true, shows the LEAF (not parent nodes) with specified rank. Default: false
 * @param {Object} [options.exactRank] - If true, shows only specified rank. Else shows all ranks UPTO specified rank. Default: false
 * @param {boolean} [options.showOptions] - Options for `.show()`
 *
 * @example
 * // Assuming the DOM has nodes with `data-insight-level` and `data-insight-rank` attributes.
 * update(treeData, { rank: 3, level: 2 }, { exactRank: false, showSiblings: true });
 *
 * @returns {insightTree} - Returns the insightTree object.
 */
function update(insightTree, { rank, level }, { leaf, exactRank, ...showOptions } = {}) {
  if (leaf) rank = insightTree.tree[insightTree.leaves[rank]]?.[RANK] ?? insightTree.tree.length;
  const filter = exactRank
    ? (row) => row[RANK] == rank || row[LEVEL] <= level
    : (row) => row[RANK] <= rank || row[LEVEL] <= level;
  return insightTree
    .show(filter, showOptions)
    .classed("insight-highlight", (row) => row[RANK] <= rank)
    .classed("insight-current", (row) => row[RANK] == rank);
}

function updateLeaf(insightTree, rank, { ...updateOptions } = {}) {
  return insightTree.update({ rank }, { ...updateOptions, leaf: true });
}

const pc = new Intl.NumberFormat("en-US", { style: "percent", notation: "compact", compactDisplay: "short" });
const num = new Intl.NumberFormat("en-US", {
  style: "decimal",
  notation: "compact",
  compactDisplay: "short",
});

export const tableRender = (el, { tree, metrics }) => {
  el.innerHTML = /* html */ `
  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Group</th>
        ${metrics.map((metric) => /* html */ `<th>${metric}</th>`).join("")}
        <th>Surprise</th>
        <th>Impact</th>
      </tr>
    </thead>
    <tbody>
      ${tree
        .map(
          (rest) => /* html */ `
        <tr data-insight-level="${rest[LEVEL]}" data-insight-rank="${rest[RANK]}">
          <td>#${rest[RANK]}</th>
          <td style="padding-left:${rest[LEVEL] * 1.5}rem">
            <span class="insight-toggle"></span> ${rest[GROUP]}
          </td>
          ${metrics.map((metric) => /* html */ `<td class="text-end">${num.format(rest[metric])}</td>`).join("")}
            <td class="text-end">${pc.format(rest[SURPRISE])}</td>
            <td class="text-end">${pc.format(rest[IMPACT])}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
};
