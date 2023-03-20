# Insight Tree

The Insight Tree component breaks down a metric into a hierarchy (tree) and highlights the biggest drivers of that metric.

It requires an array of objects:

```js
const data = [
  {"target": 10, "actual" 12, "level1": "A", "level2": "A1"},
  {"target": 12, "actual" 10, "level1": "A", "level2": "A2"},
  {"target": 15, "actual" 18, "level1": "A", "level2": "A3"},
  {"target": 19, "actual" 16, "level1": "B", "level2": "B1"},
  {"target": 20, "actual" 20, "level1": "B", "level2": "B2"},
]
```

... with a `target` and `actual` value, and a hierarchy of levels.

To use it, run:

```js
import insightTree from 'insight-tree';

const tree = insightTree({
  selector: '#tree',
  data: data,
  target: 'target',
  actual: 'actual',
  levels: ['level1', 'level2'],
  template: () => '<div>...</div>'
})
tree({
  insights: 3,
  focus: true,
});
```

The `tree` object has an `update` method that can be used to update the parameters:

```js
// Increase the number of insights
tree({insights: 5});
// Disable focus mode
tree({focus: false});
```
