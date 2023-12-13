# Setup

To run this project locally:

- Clone this repo, and run `npm install` to install dependencies
- Run `npm run watch` to start auto-compiling
- Open [`index.html`](index.html) using a HTTP server (e.g. `python -m http.server`)
- Edit [`insighttree.js`](insighttree.js) or [`subtotal.js`](subtotal.js) to make changes

# Release

```shell
npm version minor
npm publish
git push --follow-tags
```
