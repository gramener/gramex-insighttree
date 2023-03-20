export function insightTree({
  selector,
  data,
  target = "target",
  actual = "actual",
  levels = [],
  indent = "3em",
  insights = 3,
  focus = true,
  template = ({
    // indentation is based on the level
    level,
    // column is the name of the level field (e.g. "country")
    column,
    // value is the value of the level field (e.g. "UK")
    value,
    // rank is the number of the insight
    rank,
    // target & actual values
    target,
    actual,
    // diff = actual - target
    diff,
    // percent = diff / target
    percent,
  }) =>
    `<div data-level="${level}" data-rank="${rank}">${repeat(
      indent,
      level
    )}#${rank} ${value} had a ${format.pc(percent)}% ${format.num(
      diff
    )} gap</div>`,
}) {
  // Calculate the tree data structure
  const tree = generateTree(data, { ascending: true });
  // Loop through each row in the tree and render the template
  for (let el of document.querySelectorAll(selector))
    el.innerHTML = tree.map(template).join("");
  // Add event handlers to the element.
  addEvents(el);

  return ({ insight, focus }) => {};
}

function generateTree(data, { ascending = true }) {
  return [
    {
      level: 1,
      column: "country",
      value: "UK",
      rank: 4,
      target: 100,
      actual: 106,
      diff: 6,
      percent: 6 / 100,
    },
    {
      level: 2,
      column: "product",
      value: "Tea",
      rank: 3,
      target: 50,
      actual: 60,
      diff: 10,
      percent: 10 / 50,
    },
    {
      level: 2,
      column: "product",
      value: "Coffee",
      rank: 1,
      target: 30,
      actual: 25,
      diff: -5,
      percent: -5 / 30,
    },
    {
      level: 2,
      column: "product",
      value: "Beer",
      rank: 2,
      target: 20,
      actual: 21,
      diff: 1,
      percent: 1 / 20,
    },
  ];
}

function repeat(indent, level) {
  return `<div style="display:inline-block;width:${indent}"></div>`.repeat(
    level
  );
}

// TODO: Chandana
// --------------------------------------
// Define format functions copy-pasting from https://gramener.com/dynarrate/#/docs/format
// Use pc.format and num.format to format the percent and diff respectively.
const format = {
  pc: (x) => x,
  num: (x) => x,
};

// Mimic the click behavior of https://gramener.com/insighttree/. Generate your own data in generateTree
// When any node is clicked,
//  if data-state is open or unset,
//    note the level
//    for all subsequent siblings where data-level = level + 1 until data-level < level
//      hide them
//      set data-state to close
//  if data-state is close
//    for all subsequent siblings where data-level = level + 1 until data-level < level
//      show them
//      set data-state to open
function addEvents(el) {

}
