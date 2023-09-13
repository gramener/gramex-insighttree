import { subtotal } from "./subtotal.js";

export function insightTree(
  selector,
  { data, groups, metrics, sort, rankBy, render = debugRender, totalGroup },
) {
  // Calculate the tree data structure
  const tree = subtotal({ data, groups, metrics, sort, rankBy, totalGroup });
  // Render the tree
  let el = document.querySelector(selector);
  if (!el) throw new Error(`selector ${selector} missing`);
  render(el, tree, { selector, data, groups, metrics, sort, rankBy });
  // Mark leaf nodes
  for (const leaf of el.querySelectorAll(`[data-insight-level="${groups.length}"]`))
    leaf.classList.add("insight-leaf");
  // Listen to clicks and expand/collapse nodes
  el.addEventListener("click", (e) => {
    // Find the node that was clicked
    const node = e.target.closest("[data-insight-level]");
    if (node) toggle.bind(el, tree)(node);
  });
  return {
    data: tree,
    update: update.bind(el, tree),
    toggle: toggle.bind(el, tree),
    filter: filter.bind(el, tree),
  };
}

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

function filter(tree, filter) {
  const nodes = this.querySelectorAll("[data-insight-level]");
  nodes.forEach((node, i) => toggle.bind(this)(tree, node, filter(tree[i], node)));
}

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
