import { subtotal } from "./subtotal.js";

export function insightTree({
  selector,
  data,
  groups,
  metrics,
  sort,
  rankBy,
  render = debugRender,
}) {
  // Calculate the tree data structure
  const tree = subtotal({ data, groups, metrics, sort, rankBy });
  let el = document.querySelector(selector);
  render(el, tree, { selector, data, groups, metrics, sort, rankBy });
  el.addEventListener("click", toggle);
  return {
    data: tree,
    update: update.bind(el),
  };
}

function toggle(e) {
  const node = e.target.closest("[data-insight-level]");
  if (node == null) return;
  const nodes = this.querySelectorAll("[data-insight-level]");
  let i = 0;
  for (; i < nodes.length; i++) if (nodes[i] === node) break;
  const nodeLevel = +node.dataset.insightLevel;
  const nodeClosed = node.classList.contains("insight-closed");
  node.classList.toggle("insight-closed");
  for (i++; i < nodes.length; i++) {
    const levelDiff = +nodes[i].dataset.insightLevel - nodeLevel;
    if (nodeClosed) {
      // Unhide child nodes, but don't open them
      if (levelDiff == 1) {
        nodes[i].classList.remove("insight-hidden");
      } else if (levelDiff <= 0) {
        break;
      }
    } else {
      // Hide and close all child nodes
      if (levelDiff > 0) {
        nodes[i].classList.add("insight-closed", "insight-hidden");
      } else {
        break;
      }
    }
  }
}

function update({ rank }) {
  const nodes = this.querySelectorAll("[data-insight-level]");
  const insightRank = +rank;
  nodes.forEach((el, i) => {
    const diff = +el.dataset.insightRank - insightRank;
    if (diff <= 0) {
      // Show and highlight all insights up to the rank
      el.classList.add("insight-highlight", "insight-closed");
      el.classList.remove("insight-hidden", "insight-current");
      if (diff == 0) el.classList.add("insight-current");
      // Ensure all parent nodes are open and visible
      let nodeLevel = +nodes[i].dataset.insightLevel;
      for (let j = i - 1; j >= 0; j--) {
        if (+nodes[j].dataset.insightLevel < nodeLevel) {
          nodeLevel = +nodes[j].dataset.insightLevel;
          nodes[j].classList.remove("insight-hidden", "insight-closed");
        }
      }
    } else {
      // Un-highlight all insights below the rank
      el.classList.remove("insight-highlight", "insight-current");
      // Hide all insights below the rank
      el.classList.add("insight-hidden", "insight-closed");
    }
  });
}

export const format = {
  pc: (x) =>
    new Intl.NumberFormat("en-US", {
      style: "percent",
      notation: "compact",
      compactDisplay: "short",
    }).format(x),
  num: (x) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      notation: "compact",
      compactDisplay: "short",
    }).format(x),
};

const debugRender = (el, tree) => {
  const html = tree.map(
    ({ _level, _rank, _group, ...row }) => /* html */ `
<div data-insight-level="${_level}" data-insight-rank="${_rank}"
    style="padding-left: ${_level * 1.5}rem">
  <span class="insight-toggle"></span>
  <code>#${_rank} ${_group}: ${JSON.stringify(row)}</code>
</div>`
  );
  el.innerHTML = html.join("");
};
