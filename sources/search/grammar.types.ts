/* eslint-disable */

interface PegJSPosition {
  offset: number;
  line: number;
  column: number;
}

interface PegJSLocation {
  start: PegJSPosition;
  end: PegJSPosition;
}

const peg$type$action0 = () => {
  return null;
};
const peg$type$action1 = (
  head: ast.Secondary,
  tail: Array<{ type: ast.LogicalOperator; right: ast.Secondary }>,
) => {
  type Node =
    | ast.Secondary
    | {
        type: ast.LogicalOperator;
        left: Node;
        right: Node;
      };

  let root: Node = { type: `and`, left: head, right: head };
  let current = root;

  for (let next of tail) {
    current.right = { type: next.type, left: current.right, right: next.right };
    current = current.right;
  }

  return root.right;
};
const peg$type$action2 = () => {
  return `and` as const;
};
const peg$type$action3 = () => {
  return `or` as const;
};
const peg$type$action4 = () => {
  return `and` as const;
};
const peg$type$action5 = (
  field: ast.Ident,
  operator: ast.Operator,
  value: ast.Value,
) => {
  return { type: `filter` as const, field, operator, value };
};
const peg$type$action6 = (value: ast.Value) => {
  return { type: `default` as const, value };
};
const peg$type$action7 = () => {
  return `=` as const;
};
const peg$type$action8 = () => {
  return parseInt(text(), 10);
};
const peg$type$action9 = () => {
  return "\b";
};
const peg$type$action10 = () => {
  return "\f";
};
const peg$type$action11 = () => {
  return "\n";
};
const peg$type$action12 = () => {
  return "\r";
};
const peg$type$action13 = () => {
  return "\t";
};
const peg$type$action14 = (digits: string) => {
  return String.fromCharCode(parseInt(digits, 16));
};

namespace ast {
  export type Query = ast.Expression | ReturnType<typeof peg$type$action0>;
  export type Expression = ReturnType<typeof peg$type$action1>;
  export type LogicalOperator =
    | ReturnType<typeof peg$type$action2>
    | ReturnType<typeof peg$type$action3>
    | ReturnType<typeof peg$type$action4>;
  export type Secondary =
    | never
    | ReturnType<typeof peg$type$action5>
    | ReturnType<typeof peg$type$action6>;
  export type Ident = string;
  export type Operator =
    | ReturnType<typeof peg$type$action7>
    | "!="
    | "<"
    | "<="
    | ">"
    | ">=";
  export type Value = string | ReturnType<typeof peg$type$action8> | string;
  export type Char =
    | string
    | '"'
    | "\\"
    | "/"
    | ReturnType<typeof peg$type$action9>
    | ReturnType<typeof peg$type$action10>
    | ReturnType<typeof peg$type$action11>
    | ReturnType<typeof peg$type$action12>
    | ReturnType<typeof peg$type$action13>
    | ReturnType<typeof peg$type$action14>;
  export type Hex = string;
  export type Unknown = Array<string>;
}

declare type ParseResults = {
  Query: ast.Query;
  Expression: ast.Expression;
  LogicalOperator: ast.LogicalOperator;
  Secondary: ast.Secondary;
  Ident: ast.Ident;
  Operator: ast.Operator;
  Value: ast.Value;
  Char: ast.Char;
  Hex: ast.Hex;
  Unknown: ast.Unknown;
};

declare function tuple<T extends any[]>(val: [...T]): [...T];
declare function error(message: string, location?: PegJSLocation): never;
declare function expected(description: string, location?: PegJSLocation): never;
declare function onRollback(fn: () => void): void;
declare function location(): PegJSLocation;
declare function text(): string;

type ParseResult = ast.Query;
declare const parse: (data: string) => ParseResult;

export { PegJSLocation, PegJSPosition, ParseResults, ParseResult, ast, parse };

// Only meant to make it easier to debug the grammar types
declare const val: ParseResult;
val;
