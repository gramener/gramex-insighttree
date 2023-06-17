# Insight Tree

The Insight Tree component breaks down a metric into a hierarchy (tree) and highlights the biggest drivers of that metric, like this:

[![Sales - Insight Tree](sales.gif)](sales.html ":include :type=html")

# Installation

Install via `npm`:

```bash
npm install @gramex/insighttree@2
```

Use locally as an ES module:

```html
<link rel="stylesheet" href="./node_modules/@gramex/insighttree/insighttree.css" />
<script type="module">
  import { insightTree } from "./node_modules/@gramex/insighttree/insighttree.js";
</script>
```

Use locally as a script:

```html
<link rel="stylesheet" href="./node_modules/@gramex/insighttree/insighttree.css" />
<script src="./node_modules/@gramex/insighttree/insighttree.min.js"></script>
<script>
  gramex.insightTree(...)
</script>
```

Use via CDN as an ES Module:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gramex/insighttree@2/insighttree.css" />
<script type="module">
  import { insightTree } from "https://cdn.jsdelivr.net/npm/@gramex/insighttree@2/insighttree.js";
</script>
```

Use via CDN as a script:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gramex/insighttree@2/insighttree.css" />
<script src="https://cdn.jsdelivr.net/npm/@gramex/insighttree@2/insighttree.min.js"></script>
<script>
  gramex.insightTree(...)
</script>
```

# Tutorial

`insightTree()` needs an array of objects with at least 1 grouping variable
(e.g. `country`, `product`, `channel`) and at least 1 metric (e.g. `sales`, `target`). For example:

[sales-data.json](sales-data.json ":ignore")

| city | product | channel | sales | target | gap |
| ---- | ------- | ------- | ----: | -----: | --: |
| Aden | Clock   | Online  |    61 |     76 | -15 |
| Aden | Clock   | Retail  |    66 |     83 | -17 |
| Aden | Drone   | Online  |    33 |     52 | -19 |
| Aden | Drone   | Retail  |   105 |     90 |  15 |
| ...  | ...     | ...     |   ... |    ... | ... |

## Create an insight tree from data

To create a basic insight tree with this data, construct the `insightTree()` as follows:

[Source code](sales-tutorial-1.html ":include :type=code")

Output:

[[Tutorial - 1](sales-tutorial-1.png)](sales-tutorial-1.html ":include :type=html height=200px")

This tree:

- **Ranks the gaps**. `#1` is where sales was most below target, followed by `#2`, etc.
- **Focuses on insights**. It shows only the 4 biggest gaps (and its parents), hiding the rest
- **Lets you explore**. Click any row to expand or collapse it

## Expand or collapse levels

Call `tree.update({ level: 1 })` to show the level 0 (root node) and level 1 (children of root node):

[![Tutorial - 1a](sales-tutorial-1a.gif)](sales-tutorial-1a.html ":include :type=html height=200px")

Move the slider to show more or fewer levels.

[Source code](sales-tutorial-1a.html ":include :type=code")

## Expand or collapse insights

Call `tree.update({ rank: 4 })` to show the top 4 insights.

[![Tutorial - 2](sales-tutorial-2.gif)](sales-tutorial-2.html ":include :type=html height=200px")

This tree:

- **Controls the number of insights**. Increasing the slider shows more gaps. Decreasing shows fewer gaps.
- **Highlights the current gap**. The row in orange is the current insight.

[Source code](sales-tutorial-2.html ":include :type=code")

## Style the tree

[`insightTree()`](api.md) adds classes and attributes to each row. A may have these classes:

- `.insight-current` on current ranked insight. Default style: `background-color: ##ffc107`. Set to `background-color: gold` to color it gold.
- `.insight-highlight` on higher ranked insights. Default style: `font-weight: bold`. Set to `font-weight: normal; color: red` to color it red.
- `.insight-hidden` on lower ranked insights. Default style: `display: none`. Set to `display: block; color: lightgrey` to show them in gray.
- `.insight-closed` on closed insights. Any child `.insight-toggle` is styled as
  - `.insight-toggle:before { content: "▶"; }` when open
  - This is rotated 90 degrees clockwise when closed (like ▼)

A row always has these attributes:

- `[data-insight-level]`: level of indentation. Default style: `cursor: pointer`
- `[data-insight-rank]`: rank of the insight. `1` is the highest ranked insight. No default style.

Note: You can rename the "Total" group to "All" by passing `insightTree({ ..., totalGroup: "All" })`.

Download [arrow.svg](arrow.svg ":ignore") to the same folder and add this below `<link rel="stylesheet" ...>`:

```html
<style>
  .insight-current {
    background-color: yellow;
  }
  .insight-highlight {
    color: red;
  }
  .insight-toggle:before {
    content: url("arrow.svg");
  }
</style>
```

[![Tutorial - 3](sales-tutorial-3.png)](sales-tutorial-3.html ":include :type=html height=200px")

[Source code](sales-tutorial-3.html ":include :type=code")


## Render custom trees

[`insightTree()`](api.md) accepts a `render(el, tree)` function. This can be used to render the tree in any way.

For example, to render the tree as a table, add this just after `rankBy: ...`

```js
    render: (el, tree) => el.innerHTML = /* html */ `
      <table>
        <thead><tr><th>#</th><th>Group</th><th>Gap</th><th>Sales</th><th>Target</th></tr></thead>
        <tbody>
          ${tree.map(({ _level, _rank, _group, sales, target }) => /* html */ `
            <tr data-insight-level="${_level}" data-insight-rank="${_rank}">
              <td class="text-end">#${_rank}</th>
              <td style="padding-left:${_level * 1.5}rem">
                <span class="insight-toggle"></span> ${_group}
              </td>
              <td class="text-end">${sales - target}</td>
              <td class="text-end">${sales}</td>
              <td class="text-end">${target}</td>
            </tr>`).join("")}
        </tbody>
      </table>`,
```

[![Tutorial - 4](sales-tutorial-4.png)](sales-tutorial-4.html ":include :type=html height=250px")

[Source code](sales-tutorial-4.html ":include :type=code")

The `render()` function is passed the element `el` and tree `tree`. The tree is an array of objects:

```js
[
  { _level: 0, _rank: 1, _group: "Total", sales: 5143, target: 5491 },
  { _level: 1, _rank: 23, _group: "Aden", city: "Aden", sales: 625, target: 653 },
  {
    _level: 2,
    _rank: 18,
    _group: "Clock",
    city: "Aden",
    product: "Clock",
    sales: 127,
    target: 159,
  },
  // ...
];
```

- `_level`: level of indentation
- `_rank`: rank of the insight. `1` is the highest ranked insight.
- `_group`: current group value. For `_level == 1`, this is the `city`, for `_level == 2`, this is the `product`, etc.
- All other groups keys, i.e.
  - `city` (if `_level >= 1`),
  - `product` (if `_level >= 2`)
  - `channel` (if `_level >= 3`)
- All metrics, i.e.
  - `sales`
  - `target`

**REMEMBER**:

- You MUST add `data-insight-level="${_level}` to each row
- You MUST add `data-insight-rank=${_rank}"` to each row
- Indent based on `_level`
- Add a `<span class="insight-toggle"></span>` inside the row to show the expand/collapse icon

## Integrating with other libraries

When rendering the tree, you can use any JavaScript function, including from libraries like d3 or Bootstrap.

For example, add Bootstrap to at the start of your HTML:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css" />
```

At the start of the `<script type="module">`, add a D3 color scale:

```js
import { scaleLinear } from "https://cdn.skypack.dev/d3-scale@4";
const color = scaleLinear().domain([0.5, 1, 1.2]).range(["red", "yellow", "lime"]);
```

Now, in the `render()` function, replace `<table>` with `<table class="table w-auto">` to style the table with Bootstrap.

Also replace:

```html
<td class="text-end">${sales - target}</td>
```

... with a cell that is colored based on the sales/target ratio:

```html
<td class="text-end" style="background-color:${color(sales / target)};color:black">
  ${sales - target}
</td>
```

[![Tutorial - 5](sales-tutorial-5.png)](sales-tutorial-5.html ":include :type=html height=350px")

[Source code](sales-tutorial-5.html ":include :type=code")


## Custom aggregation

`groups`, `metrics` and `sort` can be used to flexibly aggregate the data.

Given this data:

| a   | b   | x   | y   | z   |
| --- | --- | --- | --- | --- |
| a1  | b1  | 1   | 2   | 3   |
| a1  | b2  | 4   | 5   | 6   |
| a1  | b3  | 7   | 8   | 9   |
| a2  | b1  | 10  | 11  | 12  |
| a2  | b2  | 13  | 14  | 15  |
| a2  | b3  | 16  | 17  | 18  |

GROUP BY: `a`. CALCULATE: SUM(x), SUM(y), and SUM(z):

```js
  groups: ["a"],
  metrics: ["x", "y", "z"],
```

| \_level | \_group | a   | x   | y   | z   |
| ------- | ------- | --- | --- | --- | --- |
| 0       |         |     | 51  | 57  | 63  |
| 1       | a1      | a1  | 12  | 15  | 18  |
| 1       | a2      | a2  | 39  | 42  | 45  |

GROUP BY: `a`, last letter of `b`. CALCULATE: SUM(x):

```js
  groups: { a: "a", b: (row) => row.b.slice(-1) },
  metrics: ["x"],
```

| \_level | \_group | a   | b   | x   |
| ------- | ------- | --- | --- | --- |
| 0       |         |     |     | 51  |
| 1       | a1      | a1  |     | 12  |
| 2       | 1       | a1  | 1   | 1   |
| 2       | 2       | a1  | 2   | 4   |
| 2       | 3       | a1  | 3   | 7   |
| 1       | a2      | a2  |     | 39  |
| 2       | 1       | a2  | 1   | 10  |
| 2       | 2       | a2  | 2   | 13  |
| 2       | 3       | a2  | 3   | 16  |

GROUP BY: `a`. CALCULATE: SUM(x), AVG(y), the first value of z, and x - y:

```js
  groups: ["a"],
  metrics: {
    x: "sum",
    y: "avg",
    z: (data) => data[0].z,
    diff: (data, result) => result.x - result.y,
  },
```

| \_level | a   | x   | y   | z   | diff |
| ------- | --- | --- | --- | --- | ---- |
| 0       |     | 51  | 9.5 | 6   | 41.5 |
| 1       | a1  | 12  | 5   | 3   | 7    |
| 1       | a2  | 39  | 14  | 3   | 25   |

GROUP BY: `a`, `b`. CALCULATE: SUM(x). SORT BY: `x` descending:

```js
  groups: ["a", "b"],
  metrics: ["x"],
  sort: "-x",
```

| \_level | a   | b   | x   |
| ------- | --- | --- | --- |
| 0       |     |     | 51  |
| 1       | a2  |     | 39  |
| 2       | a2  | b3  | 16  |
| 2       | a2  | b2  | 13  |
| 2       | a2  | b1  | 10  |
| 1       | a1  |     | 12  |
| 2       | a1  | b3  | 7   |
| 2       | a1  | b2  | 4   |
| 2       | a1  | b1  | 1   |

GROUPS `a`, `b`. SUBTOTAL: SUM(x). SORT BY: `a` by `x` asc, `b` by the last letter `b` asc:

```js
  groups: ["a", "b"],
  metrics: ["x"],
  sort: { a: "+x", b: (m, n) => (m.b.slice(-1) < n.b.slice(-1) ? -1 : 1) },
```

| \_level | a   | b   | x   |
| ------- | --- | --- | --- |
| 0       |     |     | 51  |
| 1       | a1  |     | 12  |
| 2       | a1  | b1  | 1   |
| 2       | a1  | b2  | 4   |
| 2       | a1  | b3  | 7   |
| 1       | a2  |     | 39  |
| 2       | a2  | b1  | 10  |
| 2       | a2  | b2  | 13  |
| 2       | a2  | b3  | 16  |

# API

`insightTree({ ... })` accepts the following parameters:

- `selector`: the CSS selector to render the tree into.
- `data`: an array of objects, e.g. `[{"a": "A1", "b": "B1", "x": 10, "y": 20}, ...]`.
  Each object is a "row". Each key (e.g. `"a"`) is a "column".
- `groups`: the levels of the hierarchy, e.g. `["a", "b"]`. This can be:
  - a list of existing column names, e.g. `["a", "b"]`
  - an object of new column names and `function(row)` to calculate them. E.g.
    - `{"First name": ({ name }) => name.split(" ")[0]}`
    - `{"City type": ({ sales }) => sales > 1000 ? "Big" : "Small"}`
- `metrics`: the numbers to aggregate, e.g. `["x", "y"]`. This can be:
  - a list of existing column names, e.g. `["x", "y"]`. By default, these columns will converted to numbers and summed
  - an object of existing column names and aggregations, e.g. `{"x": "sum", "y": "avg"}`.
    Values can be: `"sum"`, `"count"`, `"avg"`, `"min"`, or `"max"`.
  - an object of new column names and `functions(rows)` to calculate them. E.g.
    - `{"First date recorded": (rows) => rows[0].date`
    - `{"Earliest date": (rows) => Math.min(...rows.map(({date}) => date))`
- `rankBy`: optional metric to rank insights by. The tree is sorted by this metric. The first entry has rank 1, the second has rank 2, and so on. This can be:
  - an existing column name, e.g. `"x"`. Use `"+x"` to sort ascending (default) and `"-x"` to sort descending. (+/- works only for numbers)
  - a function, e.g. `({ sales, target }) => sales - target`. The lowest `sales - target` (i.e. sales achievement) will be highlighted first
- `sort`: optional ways of sorting each level, e.g. `"+x"`. This can be:
  - an existing column name, e.g. `"x"`. Use `"+x"` to sort ascending (default) and `"-x"` to sort descending. (+/- works only for numbers)
  - an object of existing column names and sorting columns, e.g. `{"a": "+x", "b": "-y"}`.
  - an object of existing column names and sorting functions, e.g. `{"a": (a, b) => a.x < b.x ? +1 : -1}`
- `render`: a function renders the tree. The function is called with:
  - `el`: the node to be rendered (same as the `selector`)
  - `tree`: an array of objects, one for each row of the tree to render. The object keys are:
    - `_level`: the level of the hierarchy, e.g. `0` for the top level, `1` for the next level, and so on.
    - `_rank`: the rank of the insight, e.g. `1` for the top insight, `2` for the next insight, and so on.
    - `_group`: the group name of the current level. For example, if `_level` is 1, and `groups: ["a", "b"]`, then `_group` is value of column "b".
    - All `groups` columns are also available
    - All `metrics` columns are also available.
  - `options`: the options passed to `insightTree()`: `selection`, `data`, `groups`, `metrics`, `rankBy`
- `totalGroup`: name of the total row's `_group`. Defaults to `"Total"`

It returns a `tree` object has the following methods:

- `update({ rank, level })` updates the tree to expand / collapse to a specified rank and/or level. For example:
  - `tree.update({ rank: 5 })` shows the top 5 insights
  - `tree.update({ level: 2 })` shows the level 1 (root) + level 2 (child) rows
  - `tree.update({ rank: 5, level: 2 })` shows the top 5 insights AND all level 1 + level 2 rows

# Release notes

## 2.0.0

17 Jun 2023

- `insightTree().update({ level: n })` expands the tree to level n
- `import "insighttree.js"` provides a bundled ESM script

Backward-incompatible changes from 1.x:

- Call `gramex.insightTree()`, not `gramex.insighttree.insightTree()`
- Pass `insightTree(selector, options)`, not `insightTree({ selector, ...options })`
- insighttree does not export a `format` object. Use `Intl.NumberFormat` instead

## 1.1.0

13 Jun 2023

- `rankBy` supports column names with `+` and `-` prefixes.
  E.g. `{ rankBy: "-fees" }` highlights the highest fees first, then the next highest, and so on.

## 1.0.0

6 Apr 2023

- Initial release
