/**
 * @jest-environment jsdom
 */
import { insightTree } from "../index.js";
import { data } from "./subtotal.test.js";

describe("insightTree", () => {
  test("render() gets an element and tree array with all fields", () => {
    insightTree("body", {
      data,
      groups: ["a", "b"],
      metrics: ["x", "y"],
      render: (el, tree) => {
        expect(el.tagName).toEqual("BODY");
        expect(tree.length).toEqual(9);
        for (const node of tree)
          for (const property of ["_level", "_group", "_rank", "x", "y"]) expect(node).toHaveProperty(property);
        expect(tree[0]).not.toHaveProperty("a");
        expect(tree[0]).not.toHaveProperty("b");
        expect(tree[1]).toHaveProperty("a");
        expect(tree[1]).not.toHaveProperty("b");
        expect(tree[1]).toHaveProperty("a");
        expect(tree[2]).toHaveProperty("b");
      },
    });
  });
  test("render() renders a default debug tree", () => {
    insightTree("body", {
      data,
      groups: ["a", "b"],
      metrics: ["x", "y"],
    });
    expect(document.querySelectorAll("[data-insight-level]").length).toEqual(9);
    expect(document.querySelectorAll("[data-insight-rank]").length).toEqual(9);
    expect(document.querySelectorAll(".insight-toggle").length).toEqual(9);
  });
});
