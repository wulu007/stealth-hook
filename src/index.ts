import { getEnv } from './env'
import { hook } from './hook'
import { createLogger } from './logger'
import { setupToStringHook, setupWindowGetterHooks } from './setup'

export interface HookUtils {
  hook: typeof hook
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
  const env = getEnv()

  const getWindowId = (win: Window): string => {
    if (!windowIdMap.has(win)) {
      const id = win === rootWindow ? 'main' : `iframe-${++windowCounter}`
      windowIdMap.set(win, id)
    }
    return windowIdMap.get(win)!
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

  const setupSyncDomHooks = (win: Window, applyCallback: (win: Window) => void) => {
    const {
      Node,
      Element,
      DocumentFragment,
      HTMLIFrameElement,
      HTMLFrameElement,
      HTMLObjectElement,
    } = win

    const scanAndHook = (node: any) => {
      if (!node)
        return

      // 如果是 frame 类元素，直接处理
      if (node instanceof HTMLIFrameElement
        || node instanceof HTMLFrameElement
        || node instanceof HTMLObjectElement) {
        try {
          const childWin = node.contentWindow
          if (childWin)
            applyCallback(childWin)
        } catch {}
      } else if (node.querySelectorAll) {
        const frames = node.querySelectorAll('iframe, frame, object')
        for (let i = 0; i < frames.length; i++) {
          try {
            const childWin = (frames[i] as any).contentWindow
            if (childWin)
              applyCallback(childWin)
          } catch {}
        }
      }
    }

    // 2. 拦截 Node 插入方法 (appendChild, insertBefore, replaceChild)
    const nodeMethods = ['appendChild', 'insertBefore', 'replaceChild'] as const
    nodeMethods.forEach((method) => {
      hook.method(Node.prototype, method, (original, args, thisArg) => {
        const result = env.reflectApply(original, thisArg, args)
        const newChild = args[0]
        if (newChild instanceof Node) {
          scanAndHook(newChild)
        }
        return result
      })
    })

    // 3. 拦截 Element/DocumentFragment 的批量插入方法 (append, prepend)
    const batchMethods = ['append', 'prepend'] as const;
    [Element.prototype, DocumentFragment.prototype].forEach((proto) => {
      batchMethods.forEach((method) => {
        if (!proto[method])
          return
        hook.method(proto, method, (original, args, thisArg) => {
          const result = env.reflectApply(original, thisArg, args)
          // append/prepend 接受多个参数，且可能是字符串
          for (let i = 0; i < args.length; i++) {
            if (args[i] instanceof Node) {
              scanAndHook(args[i])
            }
          }
          return result
        })
      })
    })

    // 4. 拦截 innerHTML (Element.prototype)
    hook.setter(Element.prototype, 'innerHTML', (originalSet, args, thisArg) => {
      const result = env.reflectApply(originalSet, thisArg, args)
      scanAndHook(thisArg)
      return result
    })

    // 5. 拦截 insertAdjacentHTML (精确位置判定)
    // @ts-expect-error 可能不支持 insertAdjacentHTML
    if (Element.prototype.insertAdjacentHTML) {
      hook.method(Element.prototype, 'insertAdjacentHTML', (original, args, thisArg) => {
        const position = String(args[0]).toLowerCase()
        const result = env.reflectApply(original, thisArg, args)
        if (position === 'afterbegin' || position === 'beforeend') {
          scanAndHook(thisArg)
        } else if (position === 'beforebegin' || position === 'afterend') {
          scanAndHook((thisArg as Element).parentNode)
        }
        return result
      })
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
              logger.log(`🔄 Detected attribute change on <env.{mutation.target.tagName}>`, mutation.attributeName)
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
          const shadowRoot = env.reflectApply(original, scope, args) as ShadowRoot
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
      hook,
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
