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
    getter<T extends object, K extends keyof T>(
      obj: T,
      propName: K,
      handler: HookHandler,
    ) {
      const desc = getDescriptor(obj, propName)
      const originalGet = desc?.get as AnyFunction

      if (!desc || !originalGet || typeof originalGet !== 'function')
        return

      // 使用你的神器 createWrapper 进行完美伪装
      // (原生的 getter 通常名字叫 "get contentWindow")
      const wrapper = createWrapper(handler, originalGet)

      // 录入指纹库，闭环形成！
      nativeStrMap.set(wrapper, $reflectApply($toString, originalGet, []))
      nativeFnMap.set(wrapper, originalGet)
      $defineProperty(obj, propName, { ...desc, get: wrapper })
    },
    setter<T extends object, K extends keyof T>(
      obj: T,
      propName: K,
      handler: HookHandler,
    ) {
      const desc = getDescriptor(obj, propName as string | symbol)
      const originalSet = desc?.set as AnyFunction

      if (!desc || !originalSet || typeof originalSet !== 'function')
        return

      const wrapper = createWrapper(handler, originalSet)
      nativeStrMap.set(wrapper, $reflectApply($toString, originalSet, []))
      nativeFnMap.set(wrapper, originalSet)
      $defineProperty(obj, propName, { ...desc, set: wrapper })
    },
  }
})()
