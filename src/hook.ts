import type { AnyFunction, HookHandler } from './fake'
import { getDescriptor } from './descriptor'
import { getEnv } from './env'
import { createWrapper } from './fake'

type InferGetterHandler<T> = HookHandler<() => T>
type InferSetterHandler<T> = HookHandler<(value: T) => void>

export const hook = (() => {
  const nativeStrMap = new WeakMap<object, string>()
  const nativeFnMap = new WeakMap<AnyFunction, AnyFunction>()
  const env = getEnv()

  /**
   * 内部通用注册方法，减少重复逻辑并保持类型指纹一致
   */
  const _registerStealth = (wrapper: AnyFunction, original: AnyFunction) => {
    if (nativeStrMap.has(wrapper))
      return
    let trueOriginal = original
    while (nativeFnMap.has(trueOriginal)) {
      trueOriginal = nativeFnMap.get(trueOriginal)!
    }
    nativeStrMap.set(wrapper, env.toString(trueOriginal))
    nativeFnMap.set(wrapper, trueOriginal)
  }

  return {
    /**
     * Hook 对象上的方法
     */
    method<T extends object, K extends keyof T>(
      obj: T,
      fnName: K,
      handler: T[K] extends AnyFunction ? HookHandler<T[K]> : never,
    ) {
      const original = obj[fnName] as AnyFunction
      const desc = getDescriptor(obj, fnName)

      if (!desc || !original || typeof original !== 'function')
        return

      type F = T[K] extends AnyFunction ? T[K] : AnyFunction

      const originalFn = original as unknown as F
      const typedHandler = handler as unknown as HookHandler<F>
      const wrapper = createWrapper<F>(typedHandler, originalFn)
      _registerStealth(wrapper, originalFn)
      env.defineProperty(obj, fnName, { ...desc, value: wrapper })
    },
    /**
     * Hook 构造函数
     */
    constructor<T extends object, K extends keyof T>(
      obj: T,
      fnName: K,
      handler: T[K] extends AnyFunction ? HookHandler<T[K]> : never,
    ) {
      const original = obj[fnName]
      const desc = getDescriptor(obj, fnName)

      if (!desc || typeof original !== 'function')
        return

      type F = T[K] extends AnyFunction ? T[K] : AnyFunction
      const originalFn = original as unknown as F
      const typedHandler = handler as unknown as HookHandler<F>
      const wrapper = createWrapper(typedHandler, originalFn)
      _registerStealth(wrapper, originalFn)
      env.defineProperty(obj, fnName, { ...desc, value: wrapper })
    },
    /**
     * 获取函数伪装后的原生 toString 字符串
     */
    getNativeString(fn: AnyFunction): string {
      return nativeStrMap.get(fn) || env.toString(fn)
    },
    /**
     * 获取 Hook 后的原始函数引用
     */
    getNativeFunction<T extends AnyFunction>(hookedFn: T): T | undefined {
      return nativeFnMap.get(hookedFn) as T | undefined
    },
    /**
     * Hook 属性的 Getter
     */
    getter<T extends object, K extends keyof T>(
      obj: T,
      propName: K,
      handler: InferGetterHandler<T[K]>,
    ) {
      const desc = getDescriptor(obj, propName)
      const originalGet = desc?.get
      if (!desc || typeof originalGet !== 'function')
        return
      const wrapper = createWrapper(handler, originalGet)
      _registerStealth(wrapper, originalGet)
      env.defineProperty(obj, propName, { ...desc, get: wrapper })
    },
    /**
     * Hook 属性的 Setter
     */
    setter<T extends object, K extends keyof T>(
      obj: T,
      propName: K,
      handler: InferSetterHandler<T[K]>,
    ) {
      const desc = getDescriptor(obj, propName)
      const originalSet = desc?.set

      if (!desc || typeof originalSet !== 'function')
        return

      const wrapper = createWrapper(handler, originalSet)
      _registerStealth(wrapper, originalSet)
      env.defineProperty(obj, propName, { ...desc, set: wrapper })
    },
  }
})()
