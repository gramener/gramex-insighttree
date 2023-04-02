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
- `metrics`: the subtotals to calculate, e.g. `["x", "y"]`. This can be:
  - a list of existing column names, e.g. `["x", "y"]`. By default, these columns will be summed
  - an object of existing column names and aggregations, e.g. `{"x": "sum", "y": "avg"}`.
    Values can be: `"sum"`, `"count"`, `"avg"`, `"min"`, or `"max"`.
  - an object of new column names and `functions(rows)` to calculate them. E.g.
    - `{"First date recorded": (rows) => rows[0].date`
    - `{"Earliest date": (rows) => Math.min(...rows.map(({date}) => date))`
- `rankBy`: the metric to rank insights by. The tree is sorted by this metric. The first entry has rank 1, the second has rank 2, and so on. This can be:
  - an existing column name, e.g. `"gap"`. The lowest gap will be highlighted first
  - a function, e.g. `({ sales, target }) => sales - target`. The lowest `sales - target` (i.e. sales achievement) will be highlighted first
- `render`: a function renders the tree. The function is called with:
  - `el`: the node to be rendered (same as the `selector`)
  - `tree`: an array of objects, one for each row of the tree to render. The object keys are:
    - `_level`: the level of the hierarchy, e.g. `0` for the top level, `1` for the next level, and so on.
    - `_rank`: the rank of the insight, e.g. `1` for the top insight, `2` for the next insight, and so on.
    - `_group`: the group name of the current level. For example, if `_level` is 1, and `groups: ["a", "b"]`, then `_group` is value of column "b".
    - All `groups` columns are also available
    - All `metrics` columns are also available.
  - `options`: the options passed to `insightTree()`: `selection`, `data`, `groups`, `metrics`, `rankBy`
- `sort`: optional ways of sorting each level, e.g. `"+x"`. This can be:
  - an existing column name, e.g. `"x"`. Use `"+x"` to sort ascending (default) and `"-x"` to sort descending.
  - an object of existing column names and sorting columns, e.g. `{"a": "+x", "b": "-y"}`.
  - an object of existing column names and sorting functions, e.g. `{"a": (a, b) => a.x < b.x ? +1 : -1}`

It returns a `tree` object has an `update()` that can update the tree.

```js
// Show 5 insights
tree.update({ rank: 5 });
```
