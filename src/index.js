const always = require("ramda/src/always");
const defaultTo = require("ramda/src/defaultTo");
const dig = require("ramda/src/path");
const curry = require("ramda/src/curry");
const not = require("ramda/src/not");
const equals = require("ramda/src/equals");

const typeHandlers = {
  prop: curry(({ prop }, obj) => typeHandlers.path({ path: [prop] }, obj)),
  path: curry(({ path }, obj) => dig(path, obj)),
  value: curry(({ path, prop, value }, obj) => {
    const safePath = path || [prop];
    return equals(value, typeHandlers.path({ path: safePath }, obj));
  }),
  valueOneOf: curry(({ path, prop, values }, obj) => {
    const safePath = path || [prop];
    return values.some(v =>
      typeHandlers.value({ path: safePath, value: v }, obj)
    );
  })
};

const patty = curry((obj, spec) => {
  if (Array.isArray(spec)) {
    return spec.every(patty(obj));
  } else if (typeof spec === "object") {
    const { negate, type } = spec;
    const handler = defaultTo(always(false))(typeHandlers[type]);
    return (negate ? not : Boolean)(handler(spec, obj));
  }
  return false;
});

module.exports = patty;
