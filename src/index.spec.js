const patty = require("./");

const json = {
  a: {
    b: {
      c: 10
    }
  },
  x: {},
  y: 100,
  z: "zzz"
};

describe("patty", () => {
  it("takes an initial json shape and returns a function", () => {
    const actual = patty(json);
    expect(typeof actual).toEqual("function");
  });

  describe("the curried function that", () => {
    const matches = patty(json);
    describe("takes a single spec", () => {
      it("asserts path", () => {
        const p = { type: "path", path: ["a", "b", "c"] };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("negates path", () => {
        const p = { type: "path", path: ["x", "y", "z"], negate: true };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts bad path", () => {
        const p = { type: "path", path: ["a", "b", "d"] };
        const actual = matches(p);
        expect(actual).toBe(false);
      });

      it("asserts a prop", () => {
        const p = { type: "prop", prop: "y" };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts a bad prop", () => {
        const p = { type: "prop", prop: "name" };
        const actual = matches(p);
        expect(actual).toBe(false);
      });

      it("asserts a value by path", () => {
        const p = { type: "value", path: ["a", "b", "c"], value: 10 };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts a bad value by path", () => {
        const p = { type: "value", path: ["a", "b", "c"], value: ["10"] };
        const actual = matches(p);
        expect(actual).toBe(false);
      });

      it("asserts a value by prop", () => {
        const p = { type: "value", prop: "z", value: "zzz" };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts a bad value by prop", () => {
        const p = { type: "value", prop: "z", value: "10000000", negate: true };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts multiple values", () => {
        const p = {
          type: "valueOneOf",
          path: ["a", "b", "c"],
          values: [9, 10]
        };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts multiple bad values", () => {
        const p = { type: "valueOneOf", path: ["z"], values: [9, 10] };
        const actual = matches(p);
        expect(actual).toBe(false);
      });

      it("asserts multiple values by prop", () => {
        const p = {
          type: "valueOneOf",
          prop: "x",
          values: [{}, []]
        };
        const actual = matches(p);
        expect(actual).toBe(true);
      });

      it("asserts multiple bad values by prop", () => {
        const p = {
          type: "valueOneOf",
          prop: "x",
          values: ["", []]
        };
        const actual = matches(p);
        expect(actual).toBe(false);
      });
    });

    describe("takes a list of specs that", () => {
      it("asserts a match", () => {
        const specs = [
          { type: "path", path: ["a", "b", "c"] },
          { type: "value", path: ["y"], value: 100 },
          { type: "value", path: ["z"], value: "zzz" }
        ];
        const actual = matches(specs);
        expect(actual).toBe(true);
      });

      it("asserts a failure", () => {
        const specs = [
          { type: "path", path: ["a", "b", "c"] },
          { type: "path", path: ["y", "name"] },
          { type: "value", path: ["z"], value: "zz" }
        ];
        const actual = matches(specs);
        expect(actual).toBe(false);
      });

      it("asserts a failure for an empty object", () => {
        const specs = [
          { type: "path", path: ["a", "b", "c"] },
          { type: "path", path: ["y", "name"] },
          { type: "value", path: ["z"], value: "zz" }
        ];
        const actual = patty({})(specs);
        expect(actual).toBe(false);
      });
    });
  });

  it("helps with json payloads", () => {
    const noSlots = {
      state: "get_balance",
      intent: "get_balance_start",
      slots: {}
    };

    const withSlots = {
      ...noSlots,
      slots: {
        _SOURCE_ACCOUNT_: {
          type: "string",
          values: [{ tokens: "checking", resolved: -1 }]
        }
      }
    };

    const withResponseKey = key => ({
      response_slots: {
        response_type: "doesntmatter",
        speakables: { response_key: key },
        visuals: { response_key: key }
      }
    });

    const handler = obj => {
      const matches = patty(obj);

      if (
        matches([
          { type: "value", prop: "state", value: "get_balance" },
          {
            type: "path",
            path: ["slots", "_SOURCE_ACCOUNT_", "values", 0]
          }
        ])
      ) {
        return {
          ...obj,
          ...withResponseKey("slots_present")
        };
      } else if (
        matches([
          { type: "value", prop: "state", value: "get_balance" },
          {
            type: "path",
            path: ["slots", "_SOURCE_ACCOUNT_"],
            negate: true
          }
        ])
      ) {
        return {
          ...obj,
          ...withResponseKey("no_slots")
        };
      }

      return obj;
    };

    const {
      response_slots: { visuals: { response_key: actual1 } = {} }
    } = handler(noSlots);
    const {
      response_slots: { visuals: { response_key: actual2 } = {} }
    } = handler(withSlots);

    expect(actual1).toEqual("no_slots");
    expect(actual2).toEqual("slots_present");
  });
});
