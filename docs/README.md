# Insight Tree

The Insight Tree component breaks down a metric into a hierarchy (tree) and highlights the biggest drivers of that metric.

It needs an array of objects with at least 1 grouping variable (e.g. `country`, `product`, `channel`) and at least 1 metric (e.g. `sales`, `target`).

[sales-data.csv](../app/sales-data.csv ":ignore")

| city | product | channel | sales | target | gap |
| ---- | ------- | ------- | ----: | -----: | --: |
| Aden | Clock   | Online  |    61 |     76 | -15 |
| Aden | Clock   | Retail  |    66 |     83 | -17 |
| Aden | Drone   | Online  |    33 |     52 | -19 |
| Aden | Drone   | Retail  |   105 |     90 |  15 |
| ...  | ...     | ...     |   ... |    ... | ... |

To generate this output:

[Sales - Insight Tree](sales.html ":include :type=html")

![Sales - Insight Tree](sales.gif ":class=src-only")

Use this HTML:

[Sales - Insight Tree](sales.html ":include :type=code")
