import { getDescriptor } from './descriptor'

export type AnyFunction = (...args: any[]) => any

export interface HookHandler<T extends AnyFunction = AnyFunction> {
  /**
   * @param target 原函数
   * @param args 原函数的参数数组
   * @param thisArg 当前的 this 上下文 (调用者)
   */
  (target: T, args: Parameters<T>, thisArg: ThisType<T>): ReturnType<T>
}

export const createWrapper = (() => {
  const $ownKeys = Reflect.ownKeys
  const $defineProperty = Object.defineProperty
  return function (handler: HookHandler, fn: AnyFunction) {
    // get pure function
    const wrapper = {
      [fn.name](this: any, ...args: any[]) {
        return handler(fn, args, this)
      },
    }[fn.name]!

    // copy properties
    const keys = $ownKeys(fn)
    for (const key of keys) {
      if (key === 'arguments' || key === 'caller')
        continue
      const desc = getDescriptor(fn, key)
      if (desc) {
        $defineProperty(wrapper, key, desc)
      }
    }

    return wrapper
  }
})()
