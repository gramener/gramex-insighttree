/**
 * Calculates a hierarchical tree structure based on the provided data and configuration.
 *
 * @function
 * @param {Object} options - Configuration for the tree calculation.
 * @param {Object[]} options.data - An array of objects representing the data rows.
 * @param {(string[]|Object)} options.groups - ['col', ...] or {col: row => ...} defines the hierarchy levels of the tree.
 * @param {(string[]|Object)} options.metrics - ['col', ...] or {col: 'sum', col: d => ...} specifies the metrics to aggregate.
 * @param {string|Object} [options.sort] - '+col', '-col', or {col1: '-col2', ...} defines the sorting criteria for each level.
 * @param {string|function} [options.rankBy] - '+col', '-col', or d => ... specifies the metric to rank insights by.
 * @param {string} [options.totalGroup="Total"] - Name of the total row's `_group`.
 *
 * @returns {Object[]} - Returns an array of objects representing the calculated tree structure.
 *
 * @throws {Error} Throws an error for invalid `groups`, `metrics`, `sort`, or `rankBy` configurations.
 */
export function subtotal({ data, groups, metrics, sort, rankBy = undefined, totalGroup = "Total" }) {
  if (typeof groups != "object" || groups === null)
    throw new Error(`groups must be ['col', ...] or {col: row => ...}, not ${groups}`);
  // Convert array of strings [x, y, z] into object {x: x, y: y, z: z}
  if (Array.isArray(groups)) groups = Object.fromEntries(groups.map((col) => [col, col]));
  let groupNames = Object.keys(groups);
  // Convert string values into accessors
  let groupValues = Object.values(groups).map((col) => (typeof col === "function" ? col : (d) => d[col]));

  if (typeof metrics != "object" || metrics === null)
    throw new Error(`metrics must be ['col', ...] or {col: 'sum', col: d => ...}, not ${metrics}`);
  if (Array.isArray(metrics)) metrics = metrics.map((key) => [key, (d) => agg.sum(key, d)]);
  else
    metrics = Object.entries(metrics).map(([key, value]) => [
      key,
      typeof value === "function" ? value : (d) => agg[value](key, d),
    ]);

  if ((typeof sort != "object" && typeof sort != "string" && sort !== undefined) || sort === null)
    throw new Error("sort must be '+col', '-col', or {col1: '-col2', ...}");

  // Convert sorts values into a function that sorts the data by the given column
  const sorts = groupNames
    .map((col) => (typeof sort === "string" || sort === undefined ? sort : sort[col]))
    .map((order) =>
      typeof order == "string"
        ? order[0] == "+"
          ? sorters.ascending(order.slice(1))
          : order[0] == "-"
          ? sorters.descending(order.slice(1))
          : sorters.ascending(order)
        : order,
    )
    .map((order) => (order ? (a, b) => order(a.metrics, b.metrics) : order));

  // Convert rankBy to a function that returns a number that's sortable
  if (rankBy === undefined) rankBy = () => 0;
  else if (typeof rankBy == "string") {
    if (rankBy[0] == "-") {
      const rankByCol = rankBy.slice(1);
      rankBy = (d) => -d[rankByCol];
    } else if (rankBy[0] == "+") {
      const rankByCol = rankBy.slice(1);
      rankBy = (d) => d[rankByCol];
    } else {
      const rankByCol = rankBy;
      rankBy = (d) => d[rankByCol];
    }
  } else if (typeof rankBy !== "function") throw new Error(`rankBy must be a '+col', '-col', d => ..., not ${rankBy}`);

  // Return { metric: fn(data) } for based on each metric's function
  function reduce(data, context) {
    const result = Object.assign({}, context);
    for (const [key, fn] of metrics) result[key] = fn(data, result);
    return result;
  }

  const tree = nest(data, groupNames, groupValues, reduce, { _group: totalGroup });
  const result = flatten(tree, sorts);
  result
    .map((v) => [rankBy(v), v])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .forEach(([, v], i) => (v._rank = i + 1));
  // Add visit order via rank-based traversal
  function traverseTree(pendingList, visitOrder = 0) {
    while (pendingList.length) {
      const node = pendingList.shift();
      node.metrics._visitOrder = visitOrder++;
      if (node.children) {
        pendingList = pendingList.concat(Array.from(node.children.values()));
        pendingList.sort((a, b) => a.metrics._rank - b.metrics._rank);
      }
    }
  }
  traverseTree([tree]);
  return result;
}

// d3-array rollup does not support subtotals.
// https://github.com/d3/d3-array/blob/main/src/group.js
// Revise it to support subtotals at every level. Instead of:
//    tree = {label: {label: ...}
// ... it returns:
//    tree = {label: {metrics: {}, children: {label: ...}}
function nest(data, groupNames, groupValues, reduce, context = {}) {
  return (function regroup(data, i) {
    context._level = i;
    const metrics = reduce(data, context);
    if (i >= groupValues.length) return { metrics };
    const children = new Map();
    const groupName = groupNames[i];
    const keyof = groupValues[i++];
    let index = -1;
    for (const value of data) {
      const key = keyof(value, ++index, data);
      const child = children.get(key);
      if (child) child.push(value);
      else children.set(key, [value]);
    }
    for (const [key, data] of children) {
      context[groupName] = context._group = key;
      children.set(key, regroup(data, i));
      delete context[groupName];
    }
    return { metrics, children: children };
  })(data, 0);
}

function flatten(tree, sorts) {
  const result = [tree.metrics];
  const childTrees = [...(tree.children || [])].map(([, v]) => v);
  const level = tree.metrics._level;
  if (sorts[level]) childTrees.sort(sorts[level]);
  for (const subtree of childTrees) result.push(...flatten(subtree, sorts));
  return result;
}

export const agg = {
  sum: (key, v) => v.reduce((a, v) => +v[key] + a, 0),
  count: (key, v) => v.length,
  avg: (key, v) => v.reduce((a, v) => +v[key] + a, 0) / v.length,
  min: (key, v) => Math.min(...v.map((d) => +d[key])),
  max: (key, v) => Math.max(...v.map((d) => +d[key])),
};

const sorters = {
  ascending: (key) => (a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0),
  descending: (key) => (a, b) => (a[key] > b[key] ? -1 : a[key] < b[key] ? 1 : 0),
};
