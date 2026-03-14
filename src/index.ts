import type { AnyFunction, HookHandler } from './fake'
import { hook } from './hook'
import { createLogger } from './logger'

export interface HookUtils {
  hookMethod: <T extends object, K extends keyof T>(
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
  const hookedProtoSet = new WeakSet<object>()
  const interceptorSetupMap = new WeakSet<Node>()
  const windowIdMap = new WeakMap<Window, string>()
  const iframeListenerMap = new WeakMap<Node, EventListener>()
  let windowCounter = 0
  const $reflectApply = Reflect.apply

  const getWindowId = (win: Window): string => {
    if (!windowIdMap.has(win)) {
      const id = win === rootWindow ? 'main' : `iframe-${++windowCounter}`
      windowIdMap.set(win, id)
    }
    return windowIdMap.get(win)!
  }

  const setupToStringHook = (win: Window) => {
    hook.method(win.Function.prototype, 'toString', (target, args, thisArg) => {
      const fakeString = hook.getNativeString(thisArg as AnyFunction)
      if (fakeString)
        return fakeString
      return $reflectApply(target, thisArg, args)
    })
  }

  const handleIframeNode = (
    node: Node,
    applyCallback: (win: Window) => void,
  ) => {
    const element = node as HTMLIFrameElement | HTMLObjectElement
    const tryHook = () => {
      try {
        const childWin = element.contentWindow
        if (childWin) {
          applyCallback(childWin)
          setupObserver(childWin, childWin.document, applyCallback)
        }
      } catch {}
    }

    tryHook()
    const oldListener = iframeListenerMap.get(element)
    if (oldListener)
      element.removeEventListener('load', oldListener)
    element.addEventListener('load', tryHook)
    iframeListenerMap.set(element, tryHook)
  }

  const setupWindowGetterHooks = (win: Window, applyCallback: (win: Window) => void) => {
    // 需要防守的三大载体
    const targets = [
      win.HTMLIFrameElement?.prototype,
      win.HTMLFrameElement?.prototype,
      win.HTMLObjectElement?.prototype,
    ].filter(Boolean)

    const properties = ['contentWindow', 'contentDocument']
    targets.forEach((proto) => {
      properties.forEach((prop) => {
        hook.getter(proto, prop as any, (originalGet, args, thisArg) => {
          const result = $reflectApply(originalGet, thisArg, args)
          if (result) {
            const targetWin = prop === 'contentWindow'
              ? result
              : result.defaultView
            if (targetWin)
              applyCallback(targetWin)
          }
          return result
        })
      })
    })
  }

  const setupSyncDomHooks = (win: Window, applyCallback: (win: Window) => void) => {
    // 1. 拦截 Node 插入方法
    const domMethods = ['appendChild', 'insertBefore', 'replaceChild', 'append', 'prepend']
    domMethods.forEach((method) => {
      if (win.Node.prototype[method as keyof Node]) {
        hook.method(win.Node.prototype, method as any, (original, args, thisArg) => {
          // 先让浏览器执行原生的插入，此时 window[0] 刚刚生成
          const result = $reflectApply(original, thisArg, args)

          // 🚨 抢在把控制权交还给攻击者之前，立刻找出 iframe 并强行 Hook！
          const nodes = Array.from(args).flatMap(arg => arg instanceof win.DocumentFragment ? Array.from(arg.childNodes) : [arg])
          nodes.forEach((node: any) => {
            if (node.tagName === 'IFRAME' || node.tagName === 'FRAME' || node.tagName === 'OBJECT') {
              try {
                // 主动去碰一下 contentWindow，触发 Hook，打上钢印
                const childWin = node.contentWindow
                if (childWin)
                  applyCallback(childWin)
              } catch {}
            } else if (node.querySelectorAll) {
              const frames = node.querySelectorAll('iframe, frame, object')
              frames.forEach((frame: any) => {
                try {
                  const childWin = frame.contentWindow
                  if (childWin)
                    applyCallback(childWin)
                } catch {}
              })
            }
          })
          return result // 现在交还给攻击者，他们去读 window[0] 时，拿到的已经是带有钢印的了
        })
      }
    })

    // 2. 拦截 innerHTML 赋值 (防字符串注入)
    hook.setter(win.Element.prototype, 'innerHTML', (originalSet, args, thisArg) => {
      $reflectApply(originalSet, thisArg, args)
      const frames = (thisArg as Element).querySelectorAll('iframe, frame, object')
      frames.forEach((frame: any) => {
        try {
          const childWin = frame.contentWindow
          if (childWin)
            applyCallback(childWin)
        } catch {}
      })
    })

    // @ts-expect-error 可能不支持 insertAdjacentHTML
    if (win.Element.prototype.insertAdjacentHTML) {
      hook.method(
        win.Element.prototype,
        'insertAdjacentHTML',
        (original, args, thisArg) => {
          $reflectApply(original, thisArg, args)
          // @ts-expect-error 可能不支持 insertAdjacentHTML
          const parent = thisArg.parentNode || thisArg
          if (parent.querySelectorAll) {
            const frames = parent.querySelectorAll('iframe, frame, object')
            frames.forEach((frame: any) => {
              try {
                const childWin = frame.contentWindow
                if (childWin)
                  applyCallback(childWin)
              } catch {}
            })
          }
        },
      )
    }
  }

  function setupObserver(
    win: Window,
    targetNode: Node,
    applyCallback: (win: Window) => void,
  ) {
    if (interceptorSetupMap.has(targetNode))
      return
    interceptorSetupMap.add(targetNode)

    const logger = createLogger(getWindowId(win))

    try {
      const observer = new win.MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              const tagName = (node as Element).tagName
              if (tagName === 'IFRAME' || tagName === 'FRAME' || tagName === 'OBJECT') {
                handleIframeNode(node, applyCallback)
              } else if (node instanceof win.HTMLElement) {
                if (node.childElementCount > 0) {
                  const frames = node.querySelectorAll('iframe, frame, object')
                  frames.forEach(frame => handleIframeNode(frame, applyCallback))
                }
              }
            })
          } else if (mutation.type === 'attributes') {
            // 当 src/data 变化时，iframe 可能会重载，需要重新 Hook
            if (mutation.target instanceof win.Element) {
              logger.log(`🔄 Detected attribute change on <${mutation.target.tagName}>`, mutation.attributeName)
              handleIframeNode(mutation.target, applyCallback)
            }
          }
        }
      })

      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcdoc', 'data'],
      })
    } catch (e) {
      logger.warn('❌ Failed to setup MutationObserver', e)
    }
  }

  const setupShadowDomHook = (win: Window, applyCallback: (win: Window) => void) => {
    try {
      // @ts-expect-error Shadow DOM may not be supported
      if (win.Element.prototype.attachShadow) {
        hook.method(win.Element.prototype, 'attachShadow', (original, args, scope) => {
          const shadowRoot = $reflectApply(original, scope, args) as ShadowRoot
          if (shadowRoot) {
            setupObserver(win, shadowRoot, applyCallback)
          }
          return shadowRoot
        })
      }
    } catch { }
  }

  // 递归应用逻辑
  const applyToWindow = (win: Window) => {
    try {
      const proto = win.Function.prototype
      if (hookedProtoSet.has(proto))
        return
      hookedProtoSet.add(proto)
    } catch {
      return
    }

    const logger = createLogger(getWindowId(win))
    setupToStringHook(win)
    setupShadowDomHook(win, applyToWindow)
    setupWindowGetterHooks(win, applyToWindow)
    setupSyncDomHooks(win, applyToWindow)

    const utils: HookUtils = {
      hookMethod: (obj, fnName, handler) => {
        hook.method(obj, fnName, handler as any)
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
  setupObserver(rootWindow, rootWindow.document, applyToWindow)
}
