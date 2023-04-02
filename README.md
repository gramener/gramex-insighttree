# Insight Tree

When a metric (e.g. `sales`) fails to meet its target, it's important to understand why.

Usually, we group by certain columns (e.g. `city`, `product`, and `channel`) and see where the gap was largest.

But a large under-performance in one city can be offset by a good performance in another city.
So we need to drill down to the next level. And the next.

**Insight Tree** facilitates this drill-down and aggregation. It goes through **every level** of
the hierarchy, finds the largest gaps, and highlights them one by one.

The Insight Tree component breaks down a metric into a hierarchy (tree) and highlights the biggest drivers of that metric.

Here's a sample output:

![Sales - Insight Tree](docs/sales.gif)
