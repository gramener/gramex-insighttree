export const CHILDREN = Symbol("CHILDREN");
export const DESCENDANT_COUNT = Symbol("DESCENDANT_COUNT");
export const GROUP = Symbol("GROUP");
export const IMPACT = Symbol("IMPACT");
export const INDEX = Symbol("INDEX");
export const LEVEL = Symbol("LEVEL");
export const PARENT = Symbol("PARENT");
export const RANK = Symbol("RANK");
export const SURPRISE = Symbol("SURPRISE");
const VISIT_ORDER = Symbol("VISIT_ORDER");
const IMPACT_RANK = Symbol("IMPACT_RANK");

/**
 * @ignore
 * Calculates a hierarchical tree structure based on the provided data and configuration.
 *
 * @function
 * @param {Object} options - Configuration for the tree calculation.
 * @param {Object[]} options.data - An array of objects representing the data rows.
 * @param {(string[]|Object)} options.groups - ['col', ...] or {col: row => ...} defines the hierarchy levels of the tree.
 * @param {(string[]|Object)} options.metrics - ['col', ...] or {col: 'sum', col: d => ...} specifies the metrics to aggregate.
 * @param {string|Object} [options.sort] - '+col', '-col', or {col1: '-col2', ...} defines the sorting criteria for each level.
 * @param {string|function} [options.impact] - '+col', '-col', or d => ... specifies the impact metric to rank insights by.
 * @param {string|function} [options.rankBy] - '+col', '-col', or d => ... specifies the metric to traverse insights by.
 * @param {string} [options.totalGroup="Total"] - Name of the total row's `GROUP`.
 *
 * @returns {Object[]} - Returns an array of objects representing the calculated tree structure.
 *
 * @throws {Error} Throws an error for invalid `groups`, `metrics`, `sort`, or `impact` configurations.
 */
export function subtotal({
  data,
  groups,
  metrics,
  sort,
  impact = undefined,
  rankBy = (v) => v[IMPACT] * v[SURPRISE],
  totalGroup = "Total",
}) {
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

  // Convert impact to a function that returns a number that's sortable
  impact = sortableToFunction(impact);
  rankBy = sortableToFunction(rankBy);

  // Return { metric: fn(data) } for based on each metric's function
  function reduce(data, context) {
    const result = Object.assign({}, context);
    for (const [key, fn] of metrics) result[key] = fn(data, result);
    return result;
  }

  const tree = nest(data, groupNames, groupValues, reduce, { [GROUP]: totalGroup });
  const result = flatten(tree, sorts);
  result
    .map((v) => [impact(v), v])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .forEach(([val, v], i) => (v[IMPACT_RANK] = i + 1) && (v[IMPACT] = val));
  // Add visit order via rank-based traversal
  function traverseTree(pendingList, visitOrder = 0) {
    while (pendingList.length) {
      const node = pendingList.shift();
      node.metrics[VISIT_ORDER] = visitOrder++;
      if (node.children) {
        pendingList = pendingList.concat(Array.from(node.children.values()));
        pendingList.sort((a, b) => a.metrics[IMPACT_RANK] - b.metrics[IMPACT_RANK]);
      }
    }
  }
  traverseTree([tree]);
  const minImpact = Math.min(...result.map((v) => v[IMPACT]));
  const maxImpact = Math.max(...result.map((v) => v[IMPACT]));
  result.forEach((v) => {
    v[IMPACT] = (v[IMPACT] - minImpact) / (maxImpact - minImpact);
    v[SURPRISE] = v[VISIT_ORDER] / result.length;
  });
  result
    .map((v) => [rankBy(v), v])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, v], i) => (v[RANK] = i + 1));
  result.forEach((v, i) => (v[INDEX] = i));
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
    context[LEVEL] = i;
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
      context[groupName] = context[GROUP] = key;
      children.set(key, regroup(data, i));
      delete context[groupName];
    }
    return { metrics, children: children };
  })(data, 0);
}

/**
 * @ignore
 * Flattens a tree structure into an array, while applying sorting rules to each level.
 * @param {Object} tree - The tree structure to flatten.
 * @param {Array<Function>} sorts - An array of sorting functions to apply at each level of the tree.
 * @returns {Array} - The flattened array.
 */
function flatten(tree, sorts) {
  const result = [tree.metrics];
  const childTrees = [...(tree.children || [])].map(([, v]) => v);
  const level = tree.metrics[LEVEL];
  // Each node gets CHILDREN (list of direct children) and DESCENDANT_COUNT
  tree.metrics[CHILDREN] = childTrees;
  // DESCENDANT_COUNT = size of added flattened tree = newSize - currentSize
  // Here, we set DESCENDANT_COUNT to -currentSize and later add +newSize
  tree.metrics[DESCENDANT_COUNT] = -result.length;
  // Sort the subtree based on the level-specific sort before flattening
  if (sorts[level]) childTrees.sort(sorts[level]);
  // Append the flattened subtree
  for (const subtree of childTrees) {
    subtree.metrics[PARENT] = tree.metrics;
    result.push(...flatten(subtree, sorts));
  }
  // Update DESCENDANT_COUNT to the size
  tree.metrics[DESCENDANT_COUNT] += result.length;
  return result;
}

function sortableToFunction(column, name) {
  if (!column) return () => 0;
  else if (typeof column === "string") {
    if (column[0] === "-") {
      const col = column.slice(1);
      return (d) => -d[col];
    } else if (column[0] === "+") {
      const col = column.slice(1);
      return (d) => d[col];
    } else {
      return (d) => d[column];
    }
  } else if (typeof column === "function") {
    return column;
  } else {
    throw new Error(`${name} must be a '+col', '-col', d => ..., not ${column}`);
  }
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
