import { subtotal, agg, LEVEL, RANK, GROUP } from "../subtotal";

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
    subtotalCheck({ data, groups: [], metrics: ["x"] }, [{ [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51 }]);
  });
  test("groups, metrics can be list of column names", () => {
    subtotalCheck({ data, groups: ["a", "b"], metrics: ["x", "y", "z"] }, [
      { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51, y: 57, z: 63 },
      { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1", x: 12, y: 15, z: 18 },
      { [LEVEL]: 2, [RANK]: 3, [GROUP]: "b1", a: "a1", b: "b1", x: 1, y: 2, z: 3 },
      { [LEVEL]: 2, [RANK]: 4, [GROUP]: "b2", a: "a1", b: "b2", x: 4, y: 5, z: 6 },
      { [LEVEL]: 2, [RANK]: 5, [GROUP]: "b3", a: "a1", b: "b3", x: 7, y: 8, z: 9 },
      { [LEVEL]: 1, [RANK]: 6, [GROUP]: "a2", a: "a2", x: 39, y: 42, z: 45 },
      { [LEVEL]: 2, [RANK]: 7, [GROUP]: "b1", a: "a2", b: "b1", x: 10, y: 11, z: 12 },
      { [LEVEL]: 2, [RANK]: 8, [GROUP]: "b2", a: "a2", b: "b2", x: 13, y: 14, z: 15 },
      { [LEVEL]: 2, [RANK]: 9, [GROUP]: "b3", a: "a2", b: "b3", x: 16, y: 17, z: 18 },
    ]);
  });
  test("groups can be {col: 'col'|fn}", () => {
    subtotalCheck(
      {
        data,
        groups: { 0: "a", 1: ({ a, b }) => `${a[1]}${b[1]}` },
        metrics: ["x", "y", "z"],
      },
      [
        { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51, y: 57, z: 63 },
        { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, 0: "a1", x: 12, y: 15, z: 18 },
        { [GROUP]: "11", [LEVEL]: 2, [RANK]: 3, 0: "a1", 1: "11", x: 1, y: 2, z: 3 },
        { [GROUP]: "12", [LEVEL]: 2, [RANK]: 4, 0: "a1", 1: "12", x: 4, y: 5, z: 6 },
        { [GROUP]: "13", [LEVEL]: 2, [RANK]: 5, 0: "a1", 1: "13", x: 7, y: 8, z: 9 },
        { [LEVEL]: 1, [RANK]: 6, 0: "a2", [GROUP]: "a2", x: 39, y: 42, z: 45 },
        { [GROUP]: "21", [LEVEL]: 2, [RANK]: 7, 0: "a2", 1: "21", x: 10, y: 11, z: 12 },
        { [GROUP]: "22", [LEVEL]: 2, [RANK]: 8, 0: "a2", 1: "22", x: 13, y: 14, z: 15 },
        { [GROUP]: "23", [LEVEL]: 2, [RANK]: 9, 0: "a2", 1: "23", x: 16, y: 17, z: 18 },
      ]
    );
  });
  test("metrics cannot be undefined, null, string, number, boolean", () => {
    expect(() => subtotal({ data, groups: [], metrics: undefined })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: "a" })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: true })).toThrow();
  });
  test("metrics can be empty list -- no metrics, just hierarchy", () => {
    subtotalCheck({ data, groups: ["a", "b"], metrics: [] }, [
      { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total" },
      { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1" },
      { [LEVEL]: 2, [RANK]: 3, [GROUP]: "b1", a: "a1", b: "b1" },
      { [LEVEL]: 2, [RANK]: 4, [GROUP]: "b2", a: "a1", b: "b2" },
      { [LEVEL]: 2, [RANK]: 5, [GROUP]: "b3", a: "a1", b: "b3" },
      { [LEVEL]: 1, [RANK]: 6, [GROUP]: "a2", a: "a2" },
      { [LEVEL]: 2, [RANK]: 7, [GROUP]: "b1", a: "a2", b: "b1" },
      { [LEVEL]: 2, [RANK]: 8, [GROUP]: "b2", a: "a2", b: "b2" },
      { [LEVEL]: 2, [RANK]: 9, [GROUP]: "b3", a: "a2", b: "b3" },
    ]);
  });
  test("metrics can be {col: 'agg'|fn}", () => {
    subtotalCheck(
      {
        data,
        groups: ["a", "b"],
        metrics: {
          x: "avg",
          y: "min",
          z: "count",
          p: (data) => Math.round((agg.sum("x", data) / agg.sum("y", data)) * 100),
          q: (data) => Math.round((agg.sum("x", data) / agg.sum("y", data)) * 100),
        },
      },
      [
        { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 8.5, p: 89, q: 89, y: 2, z: 6 },
        { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, a: "a1", x: 4, p: 80, q: 80, y: 2, z: 3 },
        { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 3, a: "a1", b: "b1", x: 1, p: 50, q: 50, y: 2, z: 1 },
        { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 4, a: "a1", b: "b2", x: 4, p: 80, q: 80, y: 5, z: 1 },
        { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 5, a: "a1", b: "b3", x: 7, p: 88, q: 88, y: 8, z: 1 },
        { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 6, a: "a2", x: 13, p: 93, q: 93, y: 11, z: 3 },
        { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 7, a: "a2", b: "b1", x: 10, p: 91, q: 91, y: 11, z: 1 },
        { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 8, a: "a2", b: "b2", x: 13, p: 93, q: 93, y: 14, z: 1 },
        { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 9, a: "a2", b: "b3", x: 16, p: 94, q: 94, y: 17, z: 1 },
      ]
    );
  });
  test("sort cannot be undefined, null, number, boolean", () => {
    expect(() => subtotal({ data, groups: [], metrics: [], sort: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], sort: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], sort: true })).toThrow();
  });
  test("sort can be 'col', '+col', '-col'", () => {
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], sort: "x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, a: "a1", x: 12 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 3, a: "a2", x: 39 },
    ]);
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], sort: "-x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 3, a: "a1", x: 12 },
    ]);
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], sort: "+x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, a: "a1", x: 12 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 3, a: "a2", x: 39 },
    ]);
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], sort: "-a" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 3, a: "a1", x: 12 },
    ]);
  });
  test("sort can be {col: '+col', col: '-col'}", () => {
    subtotalCheck({ data, groups: ["a", "b"], metrics: ["x"], sort: { a: "+x", b: "-x" } }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, a: "a1", x: 12 },
      { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 3, a: "a1", b: "b3", x: 7 },
      { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 4, a: "a1", b: "b2", x: 4 },
      { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 5, a: "a1", b: "b1", x: 1 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 6, a: "a2", x: 39 },
      { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 7, a: "a2", b: "b3", x: 16 },
      { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 8, a: "a2", b: "b2", x: 13 },
      { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 9, a: "a2", b: "b1", x: 10 },
    ]);
  });
  test("sort can be {col: 'col'|fn}", () => {
    subtotalCheck(
      {
        data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: { a: "+x", b: (a, b) => (a.x > b.x ? -1 : a.x < b.x ? +1 : 0) },
      },
      [
        { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
        { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 2, a: "a1", x: 12 },
        { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 3, a: "a1", b: "b3", x: 7 },
        { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 4, a: "a1", b: "b2", x: 4 },
        { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 5, a: "a1", b: "b1", x: 1 },
        { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 6, a: "a2", x: 39 },
        { [GROUP]: "b3", [LEVEL]: 2, [RANK]: 7, a: "a2", b: "b3", x: 16 },
        { [GROUP]: "b2", [LEVEL]: 2, [RANK]: 8, a: "a2", b: "b2", x: 13 },
        { [GROUP]: "b1", [LEVEL]: 2, [RANK]: 9, a: "a2", b: "b1", x: 10 },
      ]
    );
  });
  test("impact cannot be null, number, boolean, array, object", () => {
    expect(() => subtotal({ data, groups: [], metrics: [], impact: null })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], impact: 1 })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], impact: true })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], impact: [] })).toThrow();
    expect(() => subtotal({ data, groups: [], metrics: [], impact: {} })).toThrow();
  });
  test("impact can be column names", () => {
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], impact: "x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 3, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 1, a: "a1", x: 12 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
    ]);
  });
  test("impact can be +column names", () => {
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], impact: "+x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 3, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 1, a: "a1", x: 12 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
    ]);
  });
  test("impact can be -column names", () => {
    subtotalCheck({ data, groups: ["a"], metrics: ["x"], impact: "-x" }, [
      { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
      { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 3, a: "a1", x: 12 },
      { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
    ]);
  });
  test("impact can be fn that gets all columns", () => {
    subtotalCheck(
      {
        data,
        groups: ["a"],
        metrics: ["x"],
        impact: ({ [LEVEL]: _level, [GROUP]: _group, x }) => _level + _group.length - x,
      },
      [
        { [GROUP]: "Total", [LEVEL]: 0, [RANK]: 1, x: 51 },
        { [GROUP]: "a1", [LEVEL]: 1, [RANK]: 3, a: "a1", x: 12 },
        { [GROUP]: "a2", [LEVEL]: 1, [RANK]: 2, a: "a2", x: 39 },
      ]
    );
  });
  test("totalGroup works", () => {
    subtotalCheck({ data, groups: [], metrics: ["x"], totalGroup: "All" }, [
      { [LEVEL]: 0, [RANK]: 1, [GROUP]: "All", x: 51 },
    ]);
  });
});

describe("tutorial - custom aggregation", () => {
  test("GROUP BY: `a`. CALCULATE: SUM(x), SUM(y), and SUM(z)", () => {
    subtotalCheck(
      {
        data: data,
        groups: ["a"],
        metrics: ["x", "y", "z"],
      },
      [
        { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51, y: 57, z: 63 },
        { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1", x: 12, y: 15, z: 18 },
        { [LEVEL]: 1, [RANK]: 3, [GROUP]: "a2", a: "a2", x: 39, y: 42, z: 45 },
      ]
    );
  });

  test("GROUP by `a`, last letter of `b`, SUBTOTAL by SUM(x)", () => {
    subtotalCheck(
      {
        data: data,
        groups: { a: "a", b: (row) => row.b.slice(-1) },
        metrics: ["x"],
      },
      [
        { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51 },
        { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1", x: 12 },
        { [LEVEL]: 2, [RANK]: 3, [GROUP]: "1", a: "a1", b: "1", x: 1 },
        { [LEVEL]: 2, [RANK]: 4, [GROUP]: "2", a: "a1", b: "2", x: 4 },
        { [LEVEL]: 2, [RANK]: 5, [GROUP]: "3", a: "a1", b: "3", x: 7 },
        { [LEVEL]: 1, [RANK]: 6, [GROUP]: "a2", a: "a2", x: 39 },
        { [LEVEL]: 2, [RANK]: 7, [GROUP]: "1", a: "a2", b: "1", x: 10 },
        { [LEVEL]: 2, [RANK]: 8, [GROUP]: "2", a: "a2", b: "2", x: 13 },
        { [LEVEL]: 2, [RANK]: 9, [GROUP]: "3", a: "a2", b: "3", x: 16 },
      ]
    );
  });

  test("GROUP by `a`, SUBTOTAL by SUM(x), AVG(y), the first value of z, and x - y", () => {
    subtotalCheck(
      {
        data: data,
        groups: ["a"],
        metrics: {
          x: "sum",
          y: "avg",
          z: (data) => data[0].z,
          diff: (data, result) => result.x - result.y,
        },
      },
      [
        { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51, y: 9.5, z: 3, diff: 41.5 },
        { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1", x: 12, y: 5, z: 3, diff: 7 },
        { [LEVEL]: 1, [RANK]: 3, [GROUP]: "a2", a: "a2", x: 39, y: 14, z: 12, diff: 25 },
      ]
    );
  });

  test("GROUP by `a`, `b`, SUBTOTAL by SUM(x), SORT `x` descending", () => {
    subtotalCheck(
      {
        data: data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: "-x",
      },
      [
        { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51 },
        { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a2", a: "a2", x: 39 },
        { [LEVEL]: 2, [RANK]: 3, [GROUP]: "b3", a: "a2", b: "b3", x: 16 },
        { [LEVEL]: 2, [RANK]: 4, [GROUP]: "b2", a: "a2", b: "b2", x: 13 },
        { [LEVEL]: 2, [RANK]: 5, [GROUP]: "b1", a: "a2", b: "b1", x: 10 },
        { [LEVEL]: 1, [RANK]: 6, [GROUP]: "a1", a: "a1", x: 12 },
        { [LEVEL]: 2, [RANK]: 7, [GROUP]: "b3", a: "a1", b: "b3", x: 7 },
        { [LEVEL]: 2, [RANK]: 8, [GROUP]: "b2", a: "a1", b: "b2", x: 4 },
        { [LEVEL]: 2, [RANK]: 9, [GROUP]: "b1", a: "a1", b: "b1", x: 1 },
      ]
    );
  });

  test("GROUP by `a`, `b`, SUBTOTAL by SUM(x), SORT `a` by `x` asc, `b` by the last letter `b` asc", () => {
    subtotalCheck(
      {
        data: data,
        groups: ["a", "b"],
        metrics: ["x"],
        sort: {
          a: "+x",
          b: (m, n) => (m.b.slice(-1) < n.b.slice(-1) ? -1 : 1),
        },
      },
      [
        { [LEVEL]: 0, [RANK]: 1, [GROUP]: "Total", x: 51 },
        { [LEVEL]: 1, [RANK]: 2, [GROUP]: "a1", a: "a1", x: 12 },
        { [LEVEL]: 2, [RANK]: 3, [GROUP]: "b1", a: "a1", b: "b1", x: 1 },
        { [LEVEL]: 2, [RANK]: 4, [GROUP]: "b2", a: "a1", b: "b2", x: 4 },
        { [LEVEL]: 2, [RANK]: 5, [GROUP]: "b3", a: "a1", b: "b3", x: 7 },
        { [LEVEL]: 1, [RANK]: 6, [GROUP]: "a2", a: "a2", x: 39 },
        { [LEVEL]: 2, [RANK]: 7, [GROUP]: "b1", a: "a2", b: "b1", x: 10 },
        { [LEVEL]: 2, [RANK]: 8, [GROUP]: "b2", a: "a2", b: "b2", x: 13 },
        { [LEVEL]: 2, [RANK]: 9, [GROUP]: "b3", a: "a2", b: "b3", x: 16 },
      ]
    );
  });
});

function subtotalCheck(config, result) {
  expect(subtotal(config)).toEqual(expect.arrayContaining(result.map((row) => expect.objectContaining(row))));
}
