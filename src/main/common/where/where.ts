function expr_eqeq(a: any, b: any) {
  // eslint-disable-next-line eqeqeq
  return a == b
}

function expr_eqeqeq(a: any, b: any) {
  return a === b
}

function expr_neq(a: any, b: any) {
  return a !== b
}

function expr_gt(a: any, b: any) {
  return a > b
}

function expr_gte(a: any, b: any) {
  return a >= b
}

function expr_lt(a: any, b: any) {
  return a < b
}

function expr_lte(a: any, b: any) {
  return a <= b
}

function expr_include(a: string, b: string) {
  return String(a).includes(String(b))
}

function expr_true(a: boolean, b: boolean) {
  return (a === true) === b
}

function expr_false(a: boolean, b: boolean) {
  return (a === false) === b
}

function expr_truthy(a: any, b: boolean) {
  return (!!a) === b
}

function expr_falsy(a: any, b: boolean) {
  return (!a) === b
}

function expr_null(a: any, b: boolean) {
  return (a === null) === b
}

function expr_undefined(a: any, b: boolean) {
  return (a === undefined) === b
}

function expr_fn(a: any, b: boolean) {
  return (typeof a === 'function') === b
}

function expr_odd(a: number, b: boolean) {
  return (a % 2 === 1) === b
}

function expr_even(a: number, b: boolean) {
  return (a % 2 === 0) === b
}

function expr_in(a: any, values: any[]) {
  return values.includes(a)
}

function expr_or(x: any, arrayCriteria: object[]) {
  if (!Array.isArray(arrayCriteria)) {
    throw new InvalidArrayCriteriaError(`expr_or arrayCriteria must be an array, given ${typeof arrayCriteria}`)
  }

  return arrayCriteria.map(parse).some((parsed) => {
    return test(x, parsed)
  })
}

function expr_and(x: any, arrayCriteria: object[]) {
  if (!Array.isArray(arrayCriteria)) {
    throw new InvalidArrayCriteriaError(`expr_and arrayCriteria must be an array, given ${typeof arrayCriteria}`)
  }

  return arrayCriteria.map(parse).every((parsed) => {
    return test(x, parsed)
  })
}

function expr_not(x: any, criteria: object) {
  const parsed = parse(criteria)
  return !test(x, parsed)
}

const EXPR_MAP = {
  eq: expr_eqeqeq, // strict equality
  eqeqeq: expr_eqeqeq, // alias for strict equality
  eqeq: expr_eqeq, // loose equality (not strict)
  neq: expr_neq,
  gt: expr_gt,
  gte: expr_gte,
  lt: expr_lt,
  lte: expr_lte,
  includes: expr_include,
  in: expr_in,

  // unary
  true: expr_true,
  false: expr_false,
  truthy: expr_truthy,
  falsy: expr_falsy,
  null: expr_null,
  undefined: expr_undefined,
  fn: expr_fn,
  odd: expr_odd,
  even: expr_even,

  or: expr_or,
  and: expr_and,
  not: expr_not,
}

export interface ParsedCriteria {
  expr: (a: any, b: any) => boolean
  name: string
  value: any
}

export function parse(criteria: object): ParsedCriteria[] {
  const result: ParsedCriteria[] = []
  for (const criteriaKey in criteria) {
    let [name, expr] = criteriaKey.split('$', 2)
    expr ??= 'eqeq' // default expression
    if (!Object.prototype.hasOwnProperty.call(EXPR_MAP, expr)) {
      throw new InvalidExpressionError(`invalid expression $${expr} (${criteriaKey}: ${criteria[criteriaKey]})`)
    }
    result.push({
      expr: EXPR_MAP[expr],
      name,
      value: criteria[criteriaKey],
    })
  }

  return result
}

export function test(x: any, parsed: ParsedCriteria[]): boolean {
  for (const p of parsed) {
    if (!p.expr(get(x, p.name), p.value)) {
      return false
    }
  }

  return true
}

export function get(x: any, path: string | undefined): unknown {
  return path ? x[path] : x
}

export function filter<T>(array: T[], criteria: object): T[] {
  const parsed = parse(criteria)
  return array.filter((x) => {
    return test(x, parsed)
  })
}

export function find<T>(array: T[], criteria: object): T | undefined {
  const parsed = parse(criteria)
  return array.find((x) => {
    return test(x, parsed)
  })
}

export function findIndex<T>(array: T[], criteria: object): number {
  const parsed = parse(criteria)
  return array.findIndex((x) => {
    return test(x, parsed)
  })
}

export class InvalidExpressionError extends Error {}
export class InvalidArrayCriteriaError extends InvalidExpressionError {}
