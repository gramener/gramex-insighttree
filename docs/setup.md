# Setup

Install locally via npm:

```shell
npm install @gramex/insighttree@1
```

Then include the script in your HTML:

```html
<link rel="stylesheet" href="node_modules/@gramex/insighttree/insighttree.css" />

<script src="node_modules/@gramex/insighttree/insighttree.min.js"></script>
<script>gramex.insighttree.insightTree({ selector: ".tree", data: data });</script>
<!-- or with ES Modules -->
<script type="module">
  import { insightTree } from "node_modules/@gramex/insighttree/index.js";
  insightTree({ selector: ".tree", data: data });
</script>
```

Use via [Skypack CDN](https://www.skypack.dev/) as ES Modules:

```html
<link rel="stylesheet" href="https://cdn.skypack.dev/@gramex/insighttree@1/insighttree.css" />

<script type="module">
  import { insightTree } from "https://cdn.skypack.dev/@gramex/insighttree@1";
  insightTree({ selector: ".tree", data: data });
</script>
```

Use via [jsDelivr CDN](https://www.jsdelivr.com/) as classic browser script:

```html
<link rel="stylesheet" href="http://cdn.jsdelivr.net/npm/@gramex/insighttree@1/insighttree.css" />

<script src="http://cdn.jsdelivr.net/npm/@gramex/insighttree@1/insighttree.min.js"></script>
<script>gramex.insighttree.insightTree({ selector: ".tree", data: data });</script>
```
