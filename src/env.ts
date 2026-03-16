import type { AnyFunction } from './fake'

export interface PureEnv {
  win: any
  Error: typeof Error
  reflectApply: typeof Reflect.apply
  reflectConstruct: typeof Reflect.construct
  reflectOwnKeys: typeof Reflect.ownKeys
  defineProperty: typeof Object.defineProperty
  getOwnPropertyDescriptors: typeof Object.getOwnPropertyDescriptors
  getOwnPropertyDescriptor: typeof Object.getOwnPropertyDescriptor
  toString: (fn: AnyFunction) => string
  split: (target: string, separator: string | RegExp) => string[]
  slice: <T>(target: T[], start?: number, end?: number) => T[]
  join: (target: any[], separator: string) => string
}

let _getEnv = (): PureEnv => {
  const win = typeof window !== 'undefined' ? window : globalThis

  // 1. 瞬间锁定原始引用 (原子快照)
  const { Reflect: R, Object: O, Error: E, Array: A, String: S, Function: F } = win
  const _apply = R.apply
  const _construct = R.construct
  const _ownKeys = R.ownKeys
  const _defProp = O.defineProperty
  const _getDescs = O.getOwnPropertyDescriptors
  const _toString = F.prototype.toString
  const _slice = A.prototype.slice
  const _split = S.prototype.split
  const _join = A.prototype.join

  // 2. 构造纯净环境对象
  const pure: PureEnv = {
    win,
    Error: E,
    reflectApply: _apply,
    reflectConstruct: _construct,
    reflectOwnKeys: _ownKeys,
    defineProperty: _defProp,
    getOwnPropertyDescriptors: _getDescs,
    getOwnPropertyDescriptor: O.getOwnPropertyDescriptor,
    toString: fn => _apply(_toString, fn, []),
    split: (target, sep) => _apply(_split, target, [sep]),
    slice: (target, start, end) => _apply(_slice, target, [start, end]),
    join: (target, sep) => _apply(_join, target, [sep]),
  }

  _getEnv = () => pure
  return pure
}

export const getEnv = _getEnv
export const env = getEnv()
