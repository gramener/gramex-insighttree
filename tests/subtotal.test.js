import { subtotal } from "../subtotal";

describe("readme", () => {
  const data = [
    { a: "a1", b: "b1", x: 1, y: 2, z: 3 },
    { a: "a1", b: "b2", x: 4, y: 5, z: 6 },
    { a: "a1", b: "b3", x: 7, y: 8, z: 9 },
    { a: "a2", b: "b1", x: 10, y: 11, z: 12 },
    { a: "a2", b: "b2", x: 13, y: 14, z: 15 },
    { a: "a2", b: "b3", x: 16, y: 17, z: 18 },
  ];

  test("GROUP by `a`, SUBTOTAL by SUM(x), SUM(y), and SUM(z)", () => {
    expect(
      subtotal({
        data: data,
        groups: ["a"],
        metrics: ["x", "y", "z"],
      })
    ).toEqual([
      { _level: 0, x: 51, y: 57, z: 63 },
      { _level: 1, a: "a1", x: 12, y: 15, z: 18 },
      { _level: 1, a: "a2", x: 39, y: 42, z: 45 },
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
      { _level: 0, x: 51 },
      { _level: 1, a: "a1", x: 12 },
      { _level: 2, a: "a1", b: "1", x: 1 },
      { _level: 2, a: "a1", b: "2", x: 4 },
      { _level: 2, a: "a1", b: "3", x: 7 },
      { _level: 1, a: "a2", x: 39 },
      { _level: 2, a: "a2", b: "1", x: 10 },
      { _level: 2, a: "a2", b: "2", x: 13 },
      { _level: 2, a: "a2", b: "3", x: 16 },
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
      { _level: 0, x: 51, y: 9.5, z: 3, diff: 41.5 },
      { _level: 1, a: "a1", x: 12, y: 5, z: 3, diff: 7 },
      { _level: 1, a: "a2", x: 39, y: 14, z: 12, diff: 25 },
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
      { _level: 0, x: 51 },
      { _level: 1, a: "a2", x: 39 },
      { _level: 2, a: "a2", b: "b3", x: 16 },
      { _level: 2, a: "a2", b: "b2", x: 13 },
      { _level: 2, a: "a2", b: "b1", x: 10 },
      { _level: 1, a: "a1", x: 12 },
      { _level: 2, a: "a1", b: "b3", x: 7 },
      { _level: 2, a: "a1", b: "b2", x: 4 },
      { _level: 2, a: "a1", b: "b1", x: 1 },
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
      { _level: 0, x: 51 },
      { _level: 1, a: "a1", x: 12 },
      { _level: 2, a: "a1", b: "b1", x: 1 },
      { _level: 2, a: "a1", b: "b2", x: 4 },
      { _level: 2, a: "a1", b: "b3", x: 7 },
      { _level: 1, a: "a2", x: 39 },
      { _level: 2, a: "a2", b: "b1", x: 10 },
      { _level: 2, a: "a2", b: "b2", x: 13 },
      { _level: 2, a: "a2", b: "b3", x: 16 },
    ]);
  });
});

describe("3-level hierarchy", () => {
  const data = [
    { a: "a1", b: "b1", c: "c1", x: 1, y: 2, z: 3 },
    { a: "a1", b: "b1", c: "c2", x: 2, y: 3, z: 4 },
    { a: "a1", b: "b1", c: "c3", x: 3, y: 4, z: 5 },
    { a: "a1", b: "b2", c: "c1", x: 4, y: 5, z: 6 },
    { a: "a1", b: "b2", c: "c2", x: 5, y: 6, z: 7 },
    { a: "a1", b: "b2", c: "c3", x: 6, y: 7, z: 8 },
    { a: "a1", b: "b3", c: "c1", x: 7, y: 8, z: 9 },
    { a: "a1", b: "b3", c: "c2", x: 8, y: 9, z: 10 },
    { a: "a1", b: "b3", c: "c3", x: 9, y: 10, z: 11 },
    { a: "a2", b: "b1", c: "c1", x: 10, y: 11, z: 12 },
    { a: "a2", b: "b1", c: "c2", x: 11, y: 12, z: 13 },
    { a: "a2", b: "b1", c: "c3", x: 12, y: 13, z: 14 },
    { a: "a2", b: "b2", c: "c1", x: 13, y: 14, z: 15 },
    { a: "a2", b: "b2", c: "c2", x: 14, y: 15, z: 16 },
    { a: "a2", b: "b2", c: "c3", x: 15, y: 16, z: 17 },
    { a: "a2", b: "b3", c: "c1", x: 16, y: 17, z: 18 },
    { a: "a2", b: "b3", c: "c2", x: 17, y: 18, z: 19 },
    { a: "a2", b: "b3", c: "c3", x: 18, y: 19, z: 20 },
  ];

  test("single key", () => {
    expect(subtotal({ data, groups: ["a"], metrics: ["x"] })).toEqual([
      { _level: 0, x: 171 },
      { _level: 1, a: "a1", x: 45 },
      { _level: 1, a: "a2", x: 126 },
    ]);
  });
  // subtotal({
  //   data,
  //   groups: ["a", "b", "c"],
  //   metrics: ["x", "y", "z"],
  //   sort: {'a': '-x', 'b': '-b', 'c': (a, b) => a.c < b.c ? +1 : -1},
  // })
});
