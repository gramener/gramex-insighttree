import { subtotal, agg } from "../subtotal";

export const data = [
  { a: "a1", b: "b1", x: "1", y: 2, z: 3 },
  { a: "a1", b: "b2", x: "4", y: 5, z: 6 },
  { a: "a1", b: "b3", x: "7", y: 8, z: 9 },
  { a: "a2", b: "b1", x: "10", y: 11, z: 12 },
  { a: "a2", b: "b2", x: "13", y: 14, z: 15 },
  { a: "a2", b: "b3", x: "16", y: 17, z: 18 },
];

describe("subtotal", () => {
  test("groups cannot be undefined, null, string, number, boolean", () => {
    expect(() => subtotal({ data, groups: undefined })).toThrow();
    expect(() => subtotal({ data, groups: null })).toThrow();
    expect(() => subtotal({ data, groups: "a" })).toThrow();
    expect(() => subtotal({ data, groups: 1 })).toThrow();
    expect(() => subtotal({ data, groups: true })).toThrow();
  });
  test("groups can be empty list -- just calculate total", () => {
    expect(subtotal({ data, groups: [], metrics: ["x"] })).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51 },
    ]);
  });
  test("groups, metrics can be list of column names", () => {
    expect(subtotal({ data, groups: ["a", "b"], metrics: ["x", "y", "z"] })).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51, y: 57, z: 63 },
      { _level: 1, _rank: 2, _group: "a1", a: "a1", x: 12, y: 15, z: 18 },
      { _level: 2, _rank: 3, _group: "b1", a: "a1", b: "b1", x: 1, y: 2, z: 3 },
      { _level: 2, _rank: 4, _group: "b2", a: "a1", b: "b2", x: 4, y: 5, z: 6 },
      { _level: 2, _rank: 5, _group: "b3", a: "a1", b: "b3", x: 7, y: 8, z: 9 },
      { _level: 1, _rank: 6, _group: "a2", a: "a2", x: 39, y: 42, z: 45 },
      { _level: 2, _rank: 7, _group: "b1", a: "a2", b: "b1", x: 10, y: 11, z: 12 },
      { _level: 2, _rank: 8, _group: "b2", a: "a2", b: "b2", x: 13, y: 14, z: 15 },
      { _level: 2, _rank: 9, _group: "b3", a: "a2", b: "b3", x: 16, y: 17, z: 18 },
    ]);
  });
  test("groups can be {col: 'col'|fn}", () => {
    expect(
      subtotal({
        data,
        groups: { 0: "a", 1: ({ a, b }) => `${a[1]}${b[1]}` },
        metrics: ["x", "y", "z"],
      })
    ).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51, y: 57, z: 63 },
      { _group: "a1", _level: 1, _rank: 2, 0: "a1", x: 12, y: 15, z: 18 },
      { _group: "11", _level: 2, _rank: 3, 0: "a1", 1: "11", x: 1, y: 2, z: 3 },
      { _group: "12", _level: 2, _rank: 4, 0: "a1", 1: "12", x: 4, y: 5, z: 6 },
      { _group: "13", _level: 2, _rank: 5, 0: "a1", 1: "13", x: 7, y: 8, z: 9 },
      { _level: 1, _rank: 6, 0: "a2", _group: "a2", x: 39, y: 42, z: 45 },
      { _group: "21", _level: 2, _rank: 7, 0: "a2", 1: "21", x: 10, y: 11, z: 12 },
      { _group: "22", _level: 2, _rank: 8, 0: "a2", 1: "22", x: 13, y: 14, z: 15 },
      { _group: "23", _level: 2, _rank: 9, 0: "a2", 1: "23", x: 16, y: 17, z: 18 },
    ]);
  });
  test("metrics cannot be undefined, null, string, number, boolean", () => {
    expect(() => subtotal({ data, groups: [], metrics: undefined })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: "a" })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: true })).toThrow();
  });
  test("metrics can be empty list -- no metrics, just hierarchy", () => {
    expect(subtotal({ data, groups: ["a", "b"], metrics: [] })).toEqual([
      { _level: 0, _rank: 1, _group: "Total" },
      { _level: 1, _rank: 2, _group: "a1", a: "a1" },
      { _level: 2, _rank: 3, _group: "b1", a: "a1", b: "b1" },
      { _level: 2, _rank: 4, _group: "b2", a: "a1", b: "b2" },
      { _level: 2, _rank: 5, _group: "b3", a: "a1", b: "b3" },
      { _level: 1, _rank: 6, _group: "a2", a: "a2" },
      { _level: 2, _rank: 7, _group: "b1", a: "a2", b: "b1" },
      { _level: 2, _rank: 8, _group: "b2", a: "a2", b: "b2" },
      { _level: 2, _rank: 9, _group: "b3", a: "a2", b: "b3" },
    ]);
  });
  test("metrics can be {col: 'agg'|fn}", () => {
    expect(
      subtotal({
        data,
        groups: ["a", "b"],
        metrics: {
          x: "avg",
          y: "min",
          z: "count",
          p: (data) => Math.round((agg.sum("x", data) / agg.sum("y", data)) * 100),
          q: (data) => Math.round((agg.sum("x", data) / agg.sum("y", data)) * 100),
        },
      })
    ).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 8.5, p: 89, q: 89, y: 2, z: 6 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 4, p: 80, q: 80, y: 2, z: 3 },
      { _group: "b1", _level: 2, _rank: 3, a: "a1", b: "b1", x: 1, p: 50, q: 50, y: 2, z: 1 },
      { _group: "b2", _level: 2, _rank: 4, a: "a1", b: "b2", x: 4, p: 80, q: 80, y: 5, z: 1 },
      { _group: "b3", _level: 2, _rank: 5, a: "a1", b: "b3", x: 7, p: 88, q: 88, y: 8, z: 1 },
      { _group: "a2", _level: 1, _rank: 6, a: "a2", x: 13, p: 93, q: 93, y: 11, z: 3 },
      { _group: "b1", _level: 2, _rank: 7, a: "a2", b: "b1", x: 10, p: 91, q: 91, y: 11, z: 1 },
      { _group: "b2", _level: 2, _rank: 8, a: "a2", b: "b2", x: 13, p: 93, q: 93, y: 14, z: 1 },
      { _group: "b3", _level: 2, _rank: 9, a: "a2", b: "b3", x: 16, p: 94, q: 94, y: 17, z: 1 },
    ]);
  });
  test("sort cannot be undefined, null, number, boolean", () => {
    expect(() => subtotal({ data, groups: [], metrics: [], sort: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], sort: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], sort: true })).toThrow();
  });
  test("sort can be 'col', '+col', '-col'", () => {
    expect(subtotal({ data, groups: ["a"], metrics: ["x"], sort: "x" })).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 12 },
      { _group: "a2", _level: 1, _rank: 3, a: "a2", x: 39 },
    ]);
    expect(subtotal({ data, groups: ["a"], metrics: ["x"], sort: "-x" })).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a2", _level: 1, _rank: 2, a: "a2", x: 39 },
      { _group: "a1", _level: 1, _rank: 3, a: "a1", x: 12 },
    ]);
    expect(subtotal({ data, groups: ["a"], metrics: ["x"], sort: "+x" })).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 12 },
      { _group: "a2", _level: 1, _rank: 3, a: "a2", x: 39 },
    ]);
    expect(subtotal({ data, groups: ["a"], metrics: ["x"], sort: "-a" })).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a2", _level: 1, _rank: 2, a: "a2", x: 39 },
      { _group: "a1", _level: 1, _rank: 3, a: "a1", x: 12 },
    ]);
  });
  test("sort can be {col: '+col', col: '-col'}", () => {
    expect(
      subtotal({ data, groups: ["a", "b"], metrics: ["x"], sort: { a: "+x", b: "-x" } })
    ).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 12 },
      { _group: "b3", _level: 2, _rank: 3, a: "a1", b: "b3", x: 7 },
      { _group: "b2", _level: 2, _rank: 4, a: "a1", b: "b2", x: 4 },
      { _group: "b1", _level: 2, _rank: 5, a: "a1", b: "b1", x: 1 },
      { _group: "a2", _level: 1, _rank: 6, a: "a2", x: 39 },
      { _group: "b3", _level: 2, _rank: 7, a: "a2", b: "b3", x: 16 },
      { _group: "b2", _level: 2, _rank: 8, a: "a2", b: "b2", x: 13 },
      { _group: "b1", _level: 2, _rank: 9, a: "a2", b: "b1", x: 10 },
    ]);
  });
  test("sort can be {col: 'col'|fn}", () => {
    expect(
      subtotal({
        data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: { a: "+x", b: (a, b) => (a.x > b.x ? -1 : a.x < b.x ? +1 : 0) },
      })
    ).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 12 },
      { _group: "b3", _level: 2, _rank: 3, a: "a1", b: "b3", x: 7 },
      { _group: "b2", _level: 2, _rank: 4, a: "a1", b: "b2", x: 4 },
      { _group: "b1", _level: 2, _rank: 5, a: "a1", b: "b1", x: 1 },
      { _group: "a2", _level: 1, _rank: 6, a: "a2", x: 39 },
      { _group: "b3", _level: 2, _rank: 7, a: "a2", b: "b3", x: 16 },
      { _group: "b2", _level: 2, _rank: 8, a: "a2", b: "b2", x: 13 },
      { _group: "b1", _level: 2, _rank: 9, a: "a2", b: "b1", x: 10 },
    ]);
  });
  test("rankBy cannot be null, number, boolean, array, object", () => {
    expect(() => subtotal({ data, groups: [], metrics: [], rankBy: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], rankBy: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], rankBy: true })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], rankBy: [] })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], rankBy: {} })).toThrow();
  });
  test("rankBy can be column names", () => {
    expect(subtotal({ data, groups: ["a"], metrics: ["x"], rankBy: "x" })).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 2, a: "a1", x: 12 },
      { _group: "a2", _level: 1, _rank: 3, a: "a2", x: 39 },
    ]);
  });
  test("rankBy can be fn that gets all columns", () => {
    expect(
      subtotal({
        data,
        groups: ["a"],
        metrics: ["x"],
        rankBy: ({ _level, _group, x }) => _level + _group.length - x,
      })
    ).toEqual([
      { _group: "Total", _level: 0, _rank: 1, x: 51 },
      { _group: "a1", _level: 1, _rank: 3, a: "a1", x: 12 },
      { _group: "a2", _level: 1, _rank: 2, a: "a2", x: 39 },
    ]);
  });
  test("totalGroup works", () => {
    expect(subtotal({ data, groups: [], metrics: ["x"], totalGroup: "All" })).toEqual([
      { _level: 0, _rank: 1, _group: "All", x: 51 },
    ]);
  });
});

describe("tutorial - custom aggregation", () => {
  test("GROUP BY: `a`. CALCULATE: SUM(x), SUM(y), and SUM(z)", () => {
    expect(
      subtotal({
        data: data,
        groups: ["a"],
        metrics: ["x", "y", "z"],
      })
    ).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51, y: 57, z: 63 },
      { _level: 1, _rank: 2, _group: "a1", a: "a1", x: 12, y: 15, z: 18 },
      { _level: 1, _rank: 3, _group: "a2", a: "a2", x: 39, y: 42, z: 45 },
    ]);
  });

  test("GROUP by `a`, last letter of `b`, SUBTOTAL by SUM(x)", () => {
    expect(
      subtotal({
        data: data,
        groups: { a: "a", b: (row) => row.b.slice(-1) },
        metrics: ["x"],
      })
    ).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51 },
      { _level: 1, _rank: 2, _group: "a1", a: "a1", x: 12 },
      { _level: 2, _rank: 3, _group: "1", a: "a1", b: "1", x: 1 },
      { _level: 2, _rank: 4, _group: "2", a: "a1", b: "2", x: 4 },
      { _level: 2, _rank: 5, _group: "3", a: "a1", b: "3", x: 7 },
      { _level: 1, _rank: 6, _group: "a2", a: "a2", x: 39 },
      { _level: 2, _rank: 7, _group: "1", a: "a2", b: "1", x: 10 },
      { _level: 2, _rank: 8, _group: "2", a: "a2", b: "2", x: 13 },
      { _level: 2, _rank: 9, _group: "3", a: "a2", b: "3", x: 16 },
    ]);
  });

  test("GROUP by `a`, SUBTOTAL by SUM(x), AVG(y), the first value of z, and x - y", () => {
    expect(
      subtotal({
        data: data,
        groups: ["a"],
        metrics: {
          x: "sum",
          y: "avg",
          z: (data) => data[0].z,
          diff: (data, result) => result.x - result.y,
        },
      })
    ).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51, y: 9.5, z: 3, diff: 41.5 },
      { _level: 1, _rank: 2, _group: "a1", a: "a1", x: 12, y: 5, z: 3, diff: 7 },
      { _level: 1, _rank: 3, _group: "a2", a: "a2", x: 39, y: 14, z: 12, diff: 25 },
    ]);
  });

  test("GROUP by `a`, `b`, SUBTOTAL by SUM(x), SORT `x` descending", () => {
    expect(
      subtotal({
        data: data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: "-x",
      })
    ).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51 },
      { _level: 1, _rank: 2, _group: "a2", a: "a2", x: 39 },
      { _level: 2, _rank: 3, _group: "b3", a: "a2", b: "b3", x: 16 },
      { _level: 2, _rank: 4, _group: "b2", a: "a2", b: "b2", x: 13 },
      { _level: 2, _rank: 5, _group: "b1", a: "a2", b: "b1", x: 10 },
      { _level: 1, _rank: 6, _group: "a1", a: "a1", x: 12 },
      { _level: 2, _rank: 7, _group: "b3", a: "a1", b: "b3", x: 7 },
      { _level: 2, _rank: 8, _group: "b2", a: "a1", b: "b2", x: 4 },
      { _level: 2, _rank: 9, _group: "b1", a: "a1", b: "b1", x: 1 },
    ]);
  });

  test("GROUP by `a`, `b`, SUBTOTAL by SUM(x), SORT `a` by `x` asc, `b` by the last letter `b` asc", () => {
    expect(
      subtotal({
        data: data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: {
          a: "+x",
          b: (m, n) => (m.b.slice(-1) < n.b.slice(-1) ? -1 : 1),
        },
      })
    ).toEqual([
      { _level: 0, _rank: 1, _group: "Total", x: 51 },
      { _level: 1, _rank: 2, _group: "a1", a: "a1", x: 12 },
      { _level: 2, _rank: 3, _group: "b1", a: "a1", b: "b1", x: 1 },
      { _level: 2, _rank: 4, _group: "b2", a: "a1", b: "b2", x: 4 },
      { _level: 2, _rank: 5, _group: "b3", a: "a1", b: "b3", x: 7 },
      { _level: 1, _rank: 6, _group: "a2", a: "a2", x: 39 },
      { _level: 2, _rank: 7, _group: "b1", a: "a2", b: "b1", x: 10 },
      { _level: 2, _rank: 8, _group: "b2", a: "a2", b: "b2", x: 13 },
      { _level: 2, _rank: 9, _group: "b3", a: "a2", b: "b3", x: 16 },
    ]);
  });
});
