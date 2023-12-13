/**
 * @jest-environment jsdom
 */
import {
  insightTree,
  CHILDREN,
  DESCENDANT_COUNT,
  GROUP,
  IMPACT,
  INDEX,
  LEVEL,
  // PARENT,
  RANK,
  SURPRISE,
} from "../insighttree.js";
import { data } from "./subtotal.test.js";

describe("insightTree", () => {
  test("render() gets an element and tree array with all fields", () => {
    insightTree("body", {
      data,
      groups: ["a", "b"],
      metrics: ["x", "y"],
      render: (el, { tree }) => {
        expect(el.tagName).toEqual("BODY");
        expect(tree.length).toEqual(9);
        for (const node of tree) {
          expect(CHILDREN in node).toBeTruthy();
          expect(DESCENDANT_COUNT in node).toBeTruthy();
          expect(GROUP in node).toBeTruthy();
          expect(IMPACT in node).toBeTruthy();
          expect(INDEX in node).toBeTruthy();
          expect(LEVEL in node).toBeTruthy();
          // Parent need not be in the root node
          // expect(PARENT in node).toBeTruthy();
          expect(RANK in node).toBeTruthy();
          expect(SURPRISE in node).toBeTruthy();
          expect(node).toHaveProperty("x");
          expect(node).toHaveProperty("y");
        }
        expect(tree[0]).not.toHaveProperty("a");
        expect(tree[0]).not.toHaveProperty("b");
        expect(tree[1]).toHaveProperty("a");
        expect(tree[1]).not.toHaveProperty("b");
        expect(tree[1]).toHaveProperty("a");
        expect(tree[2]).toHaveProperty("b");
        el.innerHTML = tree
          .map((row) => /* html */ `<div data-insight-level="${row[LEVEL]}" data-insight-rank="${row[RANK]}"></div>`)
          .join("");
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
