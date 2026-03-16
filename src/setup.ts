import type { AnyFunction } from './fake'
import { getEnv } from './env'
import { hook } from './hook'

export function setupToStringHook(win: Window) {
  const env = getEnv()
  hook.method(win.Function.prototype, 'toString', (target, args, thisArg) => {
    const fakeString = hook.getNativeString(thisArg as AnyFunction)
    if (fakeString)
      return fakeString
    return env.reflectApply(target, thisArg, args)
  })
}

export function setupWindowGetterHooks(
  win: Window,
  applyCallback: (win: Window) => void,
) {
  const env = getEnv()
  const targets = [
    win.HTMLIFrameElement?.prototype,
    win.HTMLFrameElement?.prototype,
    win.HTMLObjectElement?.prototype,
  ].filter(Boolean)

  const properties = ['contentWindow', 'contentDocument'] as const
  targets.forEach((proto) => {
    properties.forEach((prop) => {
      hook.getter(proto, prop, (originalGet, args, thisArg) => {
        const result = env.reflectApply(originalGet, thisArg, args)
        if (result) {
          const targetWin = prop === 'contentWindow'
            ? (result as Window)
            : (result as Document).defaultView
          if (targetWin)
            applyCallback(targetWin)
        }
        return result
      })
    })
  })
}
