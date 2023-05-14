/* globals TomSelect */
import { csvParse } from "https://cdn.skypack.dev/d3-dsv@3";
import { insightTree, format } from "../index.js";

const $data = document.querySelector("#data");
const $slider = document.querySelector("#slider");

// Clicking a page tab updates the hash
document.querySelector("body").addEventListener("shown.bs.tab", (event) => {
  location.hash = event.target.href.split("#").at(-1);
});

// Render application based on URL state
function render() {
  // Select a page tab from hash path
  let [path] = location.hash.replace(/^#/, "").split("?");
  document.querySelector(".page-tabs").querySelector(`[href="#${path}"]`)?.click();
}
window.addEventListener("hashchange", render);

/** Set #data textarea value and trigger a change event (which doesn't happen by default) */
function setData(value) {
  $data.value = value || "";
  $data.dispatchEvent(new Event("change"));
}

// Uploading a file renders its contents in #data
document.querySelector(".file-upload").addEventListener("change", (event) => {
  const reader = new FileReader();
  reader.onload = (e) => setData(e.target.result);
  reader.readAsText(event.target.files[0]);
});

// Selecting a dataset renders its contents in #data
document.querySelector(".file-select").addEventListener("change", async (event) => {
  if (!event.target.value) return;
  const response = await fetch(event.target.value);
  setData(await response.text());
});

// Based on #data value, show/hide the preview tab
$data.addEventListener("change", (event) => {
  const value = event.target.value;
  document.querySelector("#no-data").classList.toggle("d-none", !!value);
  document.querySelector("#insight-tree-container").classList.toggle("d-none", !value);
});

const groupsSelect = new TomSelect("#groups", {});
const metricsSelect = new TomSelect("#metrics", {});
const rankbySelect = new TomSelect("#rankby", {});
const sortbySelect = new TomSelect("#sortby", {});
let tree, data;

// When #data value changes, parse the data
$data.addEventListener("change", (event) => {
  data = csvParse(event.target.value);

  // Identify groups (non-numeric columns) and metrics (numeric columns) from the first 100 rows
  data.groups = [];
  data.metrics = [];
  data.columns.forEach((column) => {
    if (data.slice(0, 100).every((row) => !isNaN(row[column]))) data.metrics.push(column);
    else data.groups.push(column);
  });

  // Update the groups and metrics select boxes
  for (const [select, values] of [
    [groupsSelect, data.groups],
    [metricsSelect, data.metrics],
  ]) {
    select.clear();
    select.clearOptions();
    select.addOption(values.map((val) => ({ value: val, text: val })));
    select.setValue(values);
  }
  for (const select of [rankbySelect, sortbySelect]) {
    select.clear();
    select.clearOptions();
    select.addOption(data.metrics.map((val) => ({ value: val, text: val })));
    select.setValue(data.metrics.at(-1));
  }
});

document.querySelector("#insight-tree-controls").addEventListener("change", () => {
  const rankBy = rankbySelect.getValue();
  const sortBy = sortbySelect.getValue();
  const rankByDescending = document.querySelector("#rankby-descending").checked;
  const sortByDescending = document.querySelector("#sortby-descending").checked;
  tree = insightTree({
    selector: ".insight-tree",
    data: data,
    groups: groupsSelect.getValue(),
    metrics: metricsSelect.getValue(),
    rankBy: rankByDescending ? (row) => -row[rankBy] : (row) => row[rankBy],
    sort: `${sortByDescending ? "-" : "+"}${sortBy}`,
    render: insightTreeRender,
  });
  // Show only top 4 insights
  tree.update({ rank: +$slider.value });
});

$slider.addEventListener("input", (e) => {
  tree.update({ rank: e.target.value });
});

const insightTreeRender = (el, tree, { metrics }) => {
  const rankBy = rankbySelect.getValue();
  el.innerHTML = /* html */ `
  <table class="table table-sm w-auto">
    <thead>
      <tr>
        <th></th>
        <th>Group</th>
        ${metrics
          .map(
            (metric) => /* html */ `
          <th class="text-end ${metric == rankBy ? "bg-warning" : ""}">${metric}</th>
        `
          )
          .join("")}
      </tr>
    </thead>
    <tbody>
      ${tree
        .map(
          ({ _level, _rank, _group, ...rest }) => /* html */ `
        <tr data-insight-level="${_level}" data-insight-rank="${_rank}">
          <td class="text-end">#${_rank}</th>
          <td style="padding-left:${_level * 1.5}rem">
            <span class="insight-toggle"></span> ${_group}
          </td>
          ${metrics
            .map((metric) => /* html */ `<td class="text-end">${format.num(rest[metric])}</td>`)
            .join("")}
        </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
};

// Always start with #data
location.hash = "#data";
