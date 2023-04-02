# Insight Tree

The Insight Tree component breaks down a metric into a hierarchy (tree) and highlights the biggest drivers of that metric.

It needs an array of objects with at least 1 grouping variable (e.g. `country`, `product`, `channel`) and at least 1 metric (e.g. `sales`, `target`).

[sales-data.json](sales-data.json ":ignore")

```json
[
  { "city": "Aden", "product": "Clock", "channel": "Online", "sales": 61, "target": 76 },
  { "city": "Aden", "product": "Clock", "channel": "Retail", "sales": 66, "target": 83 },
  { "city": "Aden", "product": "Drone", "channel": "Online", "sales": 33, "target": 52 },
  { "city": "Aden", "product": "Drone", "channel": "Retail", "sales": 105, "target": 90 },
  { "city": "Aden", "product": "Phone", "channel": "Online", "sales": 60, "target": 70 }
  /* ... */
]
```

To generate this output:

[Sales - Insight Tree](sales.html ":include :type=html")

![Sales - Insight Tree](sales.gif ":class=src-only")

Use this HTML:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css" />
<link rel="stylesheet" href="https://cdn.skypack.dev/@gramex/insighttree@1/insighttree.css" />

<input class="sales-slider" type="range" min="0" max="30" value="5" />
<div class="sales-tree"></div>

<script type="module">
  import { insightTree, format } from "https://cdn.skypack.dev/@gramex/insighttree@1";
  import { rgb } from "https://cdn.skypack.dev/d3-color@3";
  import { scaleLinear } from "https://cdn.skypack.dev/d3-scale@4";

  const color = scaleLinear().domain([-0.5, 0, 0.2]).range(["red", "yellow", "lime"]);

  const response = await fetch("sales-data.json");
  const data = await response.json();
  const tree = insightTree({
    selector: ".sales-tree",
    data: data,
    groups: ["city", "product", "channel"],
    metrics: ["sales", "target"],
    rankBy: ({ sales, target }) => sales - target,
    render: (el, tree) =>
      (el.innerHTML = /* html */ `
      <table class="table table-sm w-auto">
        <thead>
          <tr><th></th><th>Group</th><th>Gap</th><th>%</th><th>Sales</th><th>Target</th></tr>
        </thead>
        <tbody>
          ${tree
            .map(
              ({ _level, _rank, _group, sales, target }) => /* html */ `
            <tr data-insight-level="${_level}" data-insight-rank="${_rank}">
              <td class="text-end">#${_rank}</th>
              <td style="padding-left:${_level * 1.5}rem">
                <span class="insight-toggle"></span> ${_group}
              </td>
              <td class="text-end">${format.num(sales - target)}</td>
              <td class="text-end" style="background-color:${color(sales / target - 1)}">
                ${format.pc(sales / target - 1)}
              </td>
              <td class="text-end">${format.num(sales)}</td>
              <td class="text-end">${format.num(target)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`),
  });
  tree.update({ rank: 5 });
  document.querySelector(".sales-slider").addEventListener("input", (e) => {
    tree.update({ rank: e.target.value });
  });
</script>
```
