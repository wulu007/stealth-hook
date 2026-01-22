import type { AnyFunction, HookHandler } from './fake'
import { hook } from './hook'
import { createLogger } from './logger'

declare global {
  interface Window {
    Node: typeof Node
    Function: typeof Function
  }
}

export interface HookUtils {
  hookMethod: <T extends object, K extends keyof T>(
    obj: T,
    fnName: K,
    handler: HookHandler<T[K] extends AnyFunction ? T[K] : AnyFunction>,
  ) => void
  hookBindThisMethod: <T extends object, K extends keyof T>(
    obj: T,
    fnName: K,
    handler: HookHandler<T[K] extends AnyFunction ? T[K] : AnyFunction>,
  ) => void
  getCurrentWindowId: () => string | number
  getNativeFunction: typeof hook.getNativeFunction
  getNativeString: typeof hook.getNativeString
}

/**
 * 开启 Hook 作用域
 * @param callback 在此处定义你的 Hook 逻辑
 * @param rootWindow 初始目标窗口
 */
export function hookScope(
  callback: (utils: HookUtils, win: Window) => void,
  rootWindow: Window,
) {
  const interceptorSetupMap = new WeakSet<Window>()
  const hookedWindows = new WeakMap<Window, string>()
  let windowCounter = 0
  const $reflectApply = Reflect.apply

  const getWindowId = (win: Window): string => {
    if (!hookedWindows.has(win)) {
      const id = win === rootWindow ? 'main' : `iframe-${++windowCounter}`
      hookedWindows.set(win, id)
    }
    return hookedWindows.get(win)!
  }

  const setupToStringHook = (win: Window) => {
    hook.method(win.Function.prototype, 'toString', (target, args, thisArg) => {
      const fakeString = hook.getNativeString(thisArg as AnyFunction)
      if (fakeString)
        return fakeString
      return $reflectApply(target, thisArg, args)
    })
  }

  function setupIframeInterceptor(win: Window, applyCallback: (win: Window) => void) {
    if (interceptorSetupMap.has(win))
      return
    interceptorSetupMap.add(win)

    const logger = createLogger(getWindowId(win))
    try {
      const NodeProto = win.Node.prototype

      const hookInsertMethod = (methodName: keyof typeof NodeProto) => {
        hook.method(NodeProto, methodName, (target, args, thisArg) => {
          const result = $reflectApply(target, thisArg, args)

          try {
            const node = args[0] as HTMLElement
            if (!node || node.tagName !== 'IFRAME')
              return result
            const iframe = node as HTMLIFrameElement
            const handleIframe = () => {
              const childWin = iframe.contentWindow
              if (childWin) {
                applyCallback(childWin)
                setupIframeInterceptor(childWin, applyCallback)
              }
            }

            handleIframe()
          } catch (e) {
            logger.warn(`Error in ${String(methodName)} hook:`, e)
          }

          return result
        })
      }

      hookInsertMethod('appendChild')
      hookInsertMethod('insertBefore')
      hookInsertMethod('replaceChild')
    } catch (e) {
      logger.warn('❌ Failed to setup iframe interceptor', e)
    }
  }

  // 递归应用逻辑
  const applyToWindow = (win: Window) => {
    if (hookedWindows.has(win))
      return

    const logger = createLogger(getWindowId(win))
    setupToStringHook(win)

    const utils: HookUtils = {
      hookMethod: (obj, fnName, handler) => {
        hook.method(obj, fnName, handler as any)
      },
      hookBindThisMethod(obj, fnName, handler) {
        hook.bindThisMethod(obj, fnName, handler as any)
      },
      getNativeFunction: hook.getNativeFunction,
      getNativeString: hook.getNativeString,
      getCurrentWindowId: () => getWindowId(win),
    }

    try {
      callback(utils, win)
      logger.log('✅ StealthHook applied')
    } catch (e) {
      logger.warn('User callback failed:', e)
    }
  }

  applyToWindow(rootWindow)
  setupIframeInterceptor(rootWindow, applyToWindow)
}
