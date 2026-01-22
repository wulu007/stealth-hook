import type { AnyFunction, HookHandler } from './fake'
import { getDescriptor } from './descriptor'
import { createWrapper } from './fake'

export const hook = (() => {
  const nativeStrMap = new WeakMap<object, string>()
  const nativeFnMap = new WeakMap<AnyFunction, AnyFunction>()
  const $toString = Function.prototype.toString
  const $defineProperty = Object.defineProperty
  const $reflectApply = Reflect.apply

  return {
    method<T extends object>(obj: T, fnName: keyof T, handler: HookHandler) {
      const original = obj[fnName] as AnyFunction
      const desc = getDescriptor(obj, fnName)

      if (!desc || !original || typeof original !== 'function')
        return

      const wrapper = createWrapper(handler, original)
      nativeStrMap.set(wrapper, $toString.call(original))
      nativeFnMap.set(wrapper, original)
      $defineProperty(obj, fnName, { ...desc, value: wrapper })
    },
    bindThisMethod<T extends object>(obj: T, fnName: keyof T, handler: HookHandler) {
      this.method(obj, fnName, (target, args, thisArg) => {
        handler(() => $reflectApply(target, thisArg, args), args, thisArg)
      })
    },
    constructor<T extends AnyFunction>(obj: T, fnName: keyof T, handler: HookHandler) {
      const original = obj[fnName] as AnyFunction
      const desc = getDescriptor(obj, fnName)

      if (!desc || !original || typeof original !== 'function')
        return

      const wrapper = createWrapper(handler, original)
      if (wrapper.prototype && 'constructor' in wrapper.prototype) {
        wrapper.prototype.constructor = wrapper
      }
      nativeStrMap.set(wrapper, $toString.call(original))
      nativeFnMap.set(wrapper, original)
      $defineProperty(obj, fnName, { ...desc, value: wrapper })
    },
    getNativeString(fn: AnyFunction): string | undefined {
      if (nativeStrMap.has(fn))
        return nativeStrMap.get(fn)
      return $reflectApply($toString, fn, [])
    },
    getNativeFunction<T extends AnyFunction>(hookedFn: T): T | undefined {
      return nativeFnMap.get(hookedFn) as T | undefined
    },
  }
})()
