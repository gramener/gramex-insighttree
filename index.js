import { subtotal } from "./subtotal.js";

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
 * @param {string|function} [options.rankBy] - Specifies the metric to rank insights by.
 * @param {function} [options.render=debugRender] - A function to render the tree.
 * @param {string} [options.totalGroup="Total"] - Name of the total row's `_group`.
 *
 * @returns {Object} - Returns an object with methods to interact with the rendered tree.
 * @returns {Object[]} .data - The calculated tree data structure.
 * @returns {function} .update - Method to update the tree.
 * @returns {function} .toggle - Method to toggle nodes' expansion or collapse state.
 * @returns {function} .filter - Method to filter nodes based on a rule.
 *
 * @example
 * const tree = insightTree("#myTree", {
 *   data: [...],
 *   groups: ["a", "b"],
 *   metrics: ["x", "y"],
 *   sort: "+x",
 *   rankBy: "x"
 * });
 *
 * @throws {Error} Throws an error if the provided selector does not match any DOM element.
 */
export function insightTree(selector, { data, groups, metrics, sort, rankBy, render = debugRender, totalGroup }) {
  // Calculate the tree data structure
  const tree = subtotal({ data, groups, metrics, sort, rankBy, totalGroup });
  // Render the tree
  let el = document.querySelector(selector);
  if (!el) throw new Error(`selector ${selector} missing`);
  render(el, tree, { selector, data, groups, metrics, sort, rankBy });
  // Mark leaf nodes
  for (const leaf of el.querySelectorAll(`[data-insight-level="${groups.length}"]`)) leaf.classList.add("insight-leaf");
  // Listen to clicks and expand/collapse nodes
  el.addEventListener("click", (e) => {
    // Find the node that was clicked
    const node = e.target.closest("[data-insight-level]");
    if (node) toggle.bind(el, tree)(node);
  });
  // Compute all leaves sorted by _rank
  const rankedLeaf = tree
    .map((node, i) => (i === tree.length - 1 || tree[i + 1]._level <= node._level ? { i, rank: node._rank } : null))
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)
    .map((leaf) => leaf.i);
  return {
    data: tree,
    update: update.bind(el, tree),
    toggle: toggle.bind(el, tree),
    filter: filter.bind(el, tree),
    updateLeaf: updateLeaf.bind(el, rankedLeaf, tree),
  };
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
 * @param {Object[]} tree - The tree data structure containing nodes with `_level`, `_rank`, `_group`, etc.
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
 * @returns {void}
 */
function toggle(tree, node, force) {
  // Find the index of the node in the list of nodes
  const nodes = this.querySelectorAll("[data-insight-level]");
  let i = 0;
  for (; i < nodes.length; i++) if (nodes[i] === node) break;
  // Toggle the node
  const nodeLevel = +node.dataset.insightLevel;
  if (force === undefined || force === null) force = node.classList.contains("insight-closed");
  node.classList.toggle("insight-closed", !force);
  // Toggle all child nodes
  for (let j = i + 1; j < tree.length && tree[j]._level > nodeLevel; j++) {
    nodes[j].classList.toggle("insight-hidden", !force || tree[j]._level > nodeLevel + 1);
    nodes[j].classList.toggle("insight-closed", true);
  }
}

/**
 * Filters the tree nodes based on a specified rule, expanding or collapsing each node accordingly.
 *
 * Uses `data-insight-level` to determine levels.
 * Applies the filter function to each node and expands the row if it returns `true`, else collapses it.
 * The filter function receives two parameters:
 * - `row`: The node object with properties like `_level`, `_rank`, `_group`, and all group keys for the row.
 * - `node`: The DOM node corresponding to the row.
 *
 * @function
 * @param {Object[]} tree - The tree data structure containing nodes with `_level`, `_rank`, `_group`, etc.
 * @param {function(Object, HTMLElement): boolean} filter - function(row, node) that returns true/false to expand/collapse node
 *
 * @example
 * // Assuming the DOM has nodes with `data-insight-level` attribute and a corresponding tree data structure.
 * filter(treeData, (row) => row._level == 0 || row._group == 'Bonn');
 *
 * @returns {void}
 */
function filter(tree, filter) {
  const nodes = this.querySelectorAll("[data-insight-level]");
  nodes.forEach((node, i) => toggle.bind(this)(tree, node, filter(tree[i], node)));
}

/**
 * Updates the visibility and styling of tree nodes based on the specified rank and level criteria.
 *
 * Uses `data-insight-level` and `data-insight-rank` of the nodes to determine levels and ranks.
 *
 * - Nodes with a rank == options.rank will have ".insight-current".
 * - Nodes with a rank <= options.rank will have ".insight-highlight".
 * - Nodes will be shown if their rank <= options.rank, or level <= options.level,
 *   or they have a child node that meets the rank criteria.
 * - Closed nodes (without a child that meets the rank criteria) will have ".insight-closed".
 *
 * @function
 * @param {Object[]} tree - The tree data structure containing nodes with `_level` and `_rank` properties.
 * @param {Object} options - The criteria for updating the tree nodes.
 * @param {number} [options.rank] - The rank criteria. Nodes with rank <= options.rank will be highlighted.
 * @param {number} [options.level] - The level criteria. Nodes with level <= options.value will be shown.
 *
 * @example
 * // Assuming the DOM has nodes with `data-insight-level` and `data-insight-rank` attributes.
 * update(treeData, { rank: 3, level: 2 });
 *
 * @returns {void}
 */
function update(tree, { rank, level }) {
  const nodes = this.querySelectorAll("[data-insight-level]");
  rank = +rank;
  level = +level;
  nodes.forEach((el, i) => {
    const nodeRank = +el.dataset.insightRank;
    const nodeLevel = +el.dataset.insightLevel;
    el.classList.toggle("insight-current", nodeRank == rank);
    el.classList.toggle("insight-highlight", nodeRank <= rank);
    let hasOpenChild = false;
    for (let j = i + 1; j < tree.length && tree[j]._level > nodeLevel; j++)
      if (tree[j]._rank <= rank) {
        hasOpenChild = true;
        break;
      }
    const show = nodeRank <= rank || nodeLevel <= level || hasOpenChild;
    el.classList.toggle("insight-hidden", !show);
    el.classList.toggle("insight-closed", !hasOpenChild);
  });
}

function updateLeaf(rankedLeaf, tree, leaf) {
  leaf = Array.isArray(leaf) ? leaf : [leaf];
  // If any leaf is not a number or less than 0, set it to 0. If any leaf is greater than the number of leaves, set it to the last leaf.
  leaf = leaf.map((l) => (typeof l !== "number" || l < 1 ? 1 : l > rankedLeaf.length ? rankedLeaf.length : l));
  const indices = leaf.map((l) => rankedLeaf[l - 1]);
  const nodes = this.querySelectorAll("[data-insight-level]");
  const directParents = new Set();
  const parentSiblings = new Set();
  const highlight = new Set(indices);
  // Highlight all indices
  for (const leafIndex of indices) {
    // Find all parents
    const parents = [];
    for (let i = leafIndex - 1, currentLevel = tree[leafIndex]._level; i >= 0; i--)
      if (tree[i]._level < currentLevel) {
        parents.push(i);
        directParents.add(i);
        currentLevel = tree[i]._level;
      }
    parents.forEach((parent) => {
      for (let i = parent - 1; i >= 0 && tree[i]._level >= tree[parent]._level; i--)
        if (tree[i]._level === tree[parent]._level) parentSiblings.add(i);
      for (let i = parent + 1; i < tree.length && tree[i]._level >= tree[parent]._level; i++)
        if (tree[i]._level === tree[parent]._level) parentSiblings.add(i);
    });
  }
  nodes.forEach((el, i) => {
    el.classList.toggle("insight-current", highlight.has(i));
    el.classList.toggle("insight-highlight", highlight.has(i));
    el.classList.toggle("insight-hidden", !directParents.has(i) && !parentSiblings.has(i) && !highlight.has(i));
    el.classList.toggle("insight-closed", !directParents.has(i));
  });
}

/**
 * A simple renderer that shows each insight as an indented row in monospace.
 * @param {*} el
 * @param {*} tree
 */
const debugRender = (el, tree) => {
  const html = tree.map(
    ({ _level, _rank, _group, ...row }) => /* html */ `
<div data-insight-level="${_level}" data-insight-rank="${_rank}"
    style="padding-left: ${_level * 1.5}rem">
  <span class="insight-toggle"></span>
  <code>#${_rank} ${_group}: ${JSON.stringify(row)}</code>
</div>`,
  );
  el.innerHTML = html.join("");
};
