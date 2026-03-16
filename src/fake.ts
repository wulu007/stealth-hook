import { getEnv } from './env'

export type AnyFunction = (this: any, ...args: any[]) => any

export type HookHandler<T extends AnyFunction> = (
  target: T,
  /** 严格映射原函数的参数元组 */
  args: Parameters<T>,
  /** 严格映射原函数的 this 类型 */
  thisArg: ThisParameterType<T>,
) => ReturnType<T>

export const createWrapper = (() => {
  const env = getEnv()
  function clearStack(e: Error) {
    if (e && typeof e.stack === 'string') {
      try {
        // 1. 抓取当前干净的调用栈
        const dStack = new env.Error().stack || ''
        const eLines = env.split(e.stack, '\n')
        const dLines = env.split(dStack, '\n')
        let eIdx = eLines.length - 1
        let dIdx = dLines.length - 1
        while (eIdx >= 0 && dIdx >= 0 && eLines[eIdx] === dLines[dIdx]) {
          eIdx--
          dIdx--
        }
        const callerIndex = eIdx + 2
        if (callerIndex < eLines.length) {
          const callerFrames = env.slice(eLines, callerIndex)
          const isV8 = e.stack.includes('    at ') // 判断是否是 Chrome/Edge
          if (isV8) {
            // V8 引擎需要保留原生的 Error Message 头部
            e.stack = `${e.toString()}\n${env.join(callerFrames, '\n')}`
          } else {
            // Firefox/Safari 只有纯调用栈
            e.stack = env.join(callerFrames, '\n')
          }
        }
      } catch {
        console.warn('Failed to clear stack trace for stealth hook')
      }
    }
  }

  return function <T extends AnyFunction>(handler: HookHandler<T>, fn: T) {
    const protoDesc = env.getOwnPropertyDescriptor(fn, 'prototype')
    const isConstructible = !!protoDesc
    let wrapper: T

    if (isConstructible) {
      wrapper = function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
        try {
          return handler(fn, args, this)
        } catch (e: any) {
          clearStack(e)
          throw e
        }
      } as unknown as T
    } else {
      wrapper = {
        [fn.name](this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
          try {
            return handler(fn, args, this)
          } catch (e: any) {
            clearStack(e)
            throw e
          }
        },
      }[fn.name]! as unknown as T
    }

    // copy properties
    const descriptors = env.getOwnPropertyDescriptors(fn)
    const reservedKeys = ['arguments', 'caller', 'prototype', 'length', 'name']
    for (const key of Object.keys(descriptors)) {
      if (!reservedKeys.includes(key)) {
        env.defineProperty(wrapper, key, descriptors[key]!)
      }
    }

    try {
      if (descriptors.name)
        env.defineProperty(wrapper, 'name', descriptors.name)
      if (descriptors.length)
        env.defineProperty(wrapper, 'length', descriptors.length)
    } catch {
      console.warn(`Failed to copy name/length property for ${fn.name}`)
    }

    if (fn.prototype) {
      // A. 让 wrapper.prototype 物理指向 fn.prototype
      // 必须确保这个属性的特性与原生一致（不可枚举）
      const desc = env.getOwnPropertyDescriptor(fn, 'prototype')!
      if (desc) {
        env.defineProperty(wrapper, 'prototype', {
          ...desc,
          value: fn.prototype,
        })
      } else {
        console.warn(`Failed to copy prototype property for ${fn.name}`)
      }

      // B. 修补原型的 constructor 指向
      // 这样 (new hookedInstance()).constructor === wrapper
      try {
        const desc = env.getOwnPropertyDescriptor(fn.prototype, 'constructor')
        env.defineProperty(wrapper.prototype, 'constructor', {
          ...desc,
          value: wrapper,
        })
      } catch { }
    }
    return wrapper
  }
})()
