import type { TestCase } from './types'

export const testCases: TestCase[] = [
  {
    id: 2,
    label: 'appendChild',
    category: 'basic',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      container.appendChild(iframe)
      return iframe
    },
  },
  {
    id: 3,
    label: 'insertBefore',
    category: 'basic',
    creator: (container) => {
      const placeholder = document.createElement('div')
      container.appendChild(placeholder)
      const iframe = document.createElement('iframe')
      container.insertBefore(iframe, placeholder)
      return iframe
    },
  },
  {
    id: 4,
    label: 'replaceChild',
    category: 'basic',
    creator: (container) => {
      const placeholder = document.createElement('div')
      container.appendChild(placeholder)
      const iframe = document.createElement('iframe')
      container.replaceChild(iframe, placeholder)
      return iframe
    },
  },
  {
    id: 5,
    label: 'innerHTML Injection',
    category: 'dom',
    creator: (container) => {
      container.innerHTML = '<div><iframe id="inner-frame"></iframe></div>'
      return container.querySelector('iframe')
    },
  },
  {
    id: 6,
    label: 'insertAdjacentHTML',
    category: 'dom',
    creator: (container) => {
      const div = document.createElement('div')
      container.appendChild(div)
      div.insertAdjacentHTML('afterend', '<iframe id="adjacent-frame"></iframe>')
      return container.querySelector('#adjacent-frame')
    },
  },
  {
    id: 7,
    label: 'document.write',
    category: 'advanced',
    creator: (container) => {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe')
        container.appendChild(iframe)
        iframe.onload = () => {
          iframe.contentDocument?.write('<p>test</p>')
          resolve(iframe)
        }
      })
    },
  },
  {
    id: 8,
    label: 'cloneNode',
    category: 'advanced',
    creator: (container) => {
      const iframe1 = document.createElement('iframe')
      const cloned = iframe1.cloneNode(true) as HTMLIFrameElement
      container.appendChild(cloned)
      return cloned
    },
  },
  {
    id: 9,
    label: 'DocumentFragment',
    category: 'advanced',
    creator: (container) => {
      const fragment = document.createDocumentFragment()
      const iframe = document.createElement('iframe')
      fragment.appendChild(iframe)
      container.appendChild(fragment)
      return iframe
    },
  },
  {
    id: 10,
    label: 'Shadow DOM (attachShadow)',
    category: 'advanced',
    creator: (container) => {
      const host = document.createElement('div')
      container.appendChild(host)
      if (!host.attachShadow)
        return null
      const shadow = host.attachShadow({ mode: 'open' })
      const iframe = document.createElement('iframe')
      shadow.appendChild(iframe)
      return iframe
    },
  },
  {
    id: 11,
    label: 'Nested Iframe (Main -> A -> B)',
    category: 'advanced',
    creator: (container) => {
      return new Promise((resolve) => {
        const iframe1 = document.createElement('iframe')
        iframe1.onload = () => {
          const iframe2 = iframe1.contentDocument?.createElement('iframe')
          if (iframe2) {
            iframe1.contentDocument?.body.appendChild(iframe2)
            const pureWindow2 = iframe2.contentWindow
            resolve(pureWindow2 ? { contentWindow: pureWindow2 } : null)
          } else {
            resolve(null)
          }
        }
        iframe1.src = 'about:blank'
        container.appendChild(iframe1)
      })
    },
  },
  {
    id: 12,
    label: 'Dynamic src Change',
    category: 'advanced',
    creator: (container) => {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe')
        let loadCount = 0
        iframe.onload = () => {
          loadCount++
          if (loadCount === 1) {
            iframe.src = 'about:blank?changed=1'
          } else if (loadCount === 2) {
            resolve(iframe)
          }
        }
        container.appendChild(iframe)
      })
    },
  },
  {
    id: 13,
    label: 'Object Tag (type=text/html)',
    category: 'bypass',
    creator: (container) => {
      return new Promise((resolve) => {
        const obj = document.createElement('object') as any
        obj.type = 'text/html'
        obj.data = 'about:blank'
        obj.onload = () => resolve(obj)
        container.appendChild(obj)
      })
    },
  },
  {
    id: 14,
    label: 'Frame Tag (Legacy)',
    category: 'bypass',
    timeout: 1500,
    creator: (container) => {
      return new Promise((resolve) => {
        const frameset = document.createElement('frameset')
        const frame = document.createElement('frame') as any
        frame.onload = () => resolve(frame)
        frameset.appendChild(frame)
        container.appendChild(frameset) // 将 frameset 放入容器
        setTimeout(() => {
          if (frame.contentWindow)
            resolve(frame)
        }, 1000)
      })
    },
  },
  {
    id: 15,
    label: 'Multi-level appendChild',
    category: 'modern',
    creator: (container) => {
      const div1 = document.createElement('div')
      const div2 = document.createElement('div')
      const iframe = document.createElement('iframe')
      div2.appendChild(iframe)
      div1.appendChild(div2)
      container.appendChild(div1)
      return iframe
    },
  },
  {
    id: 16,
    label: 'append() Method',
    category: 'modern',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      container.append(iframe)
      return iframe
    },
  },
  {
    id: 17,
    label: 'prepend() Method',
    category: 'modern',
    creator: (container) => {
      const placeholder = document.createElement('div')
      container.appendChild(placeholder)
      const iframe = document.createElement('iframe')
      container.prepend(iframe)
      return iframe
    },
  },
  {
    id: 18,
    label: 'insertAdjacentElement',
    category: 'modern',
    creator: (container) => {
      const div = document.createElement('div')
      container.appendChild(div)
      const iframe = document.createElement('iframe')
      div.insertAdjacentElement('afterend', iframe)
      return iframe
    },
  },
  {
    id: 19,
    label: 'setAttribute src',
    category: 'modern',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      container.appendChild(iframe)
      iframe.setAttribute('src', 'about:blank')
      const pureWindow = iframe.contentWindow
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 20,
    label: 'Sync Time-Gap Bypass (同步时间差攻击)',
    category: 'bypass',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      container.appendChild(iframe)
      const pureWindow = iframe.contentWindow
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 21,
    label: 'InnerHTML Sync Bypass (innerHTML 同步攻击)',
    category: 'bypass',
    creator: (container) => {
      container.innerHTML = '<iframe id="hacker-frame"></iframe>'
      const iframe = container.querySelector('#hacker-frame') as HTMLIFrameElement
      const pureWindow = iframe.contentWindow
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 22,
    label: 'Index frames Bypass (window[0] 绕过)',
    category: 'bypass',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      container.appendChild(iframe)
      const pureWindow = window[window.length - 1]
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 23,
    label: 'window.open Popup Bypass (弹出层绕过)',
    category: 'bypass',
    creator: () => {
      const popup = window.open('about:blank', '_blank', 'width=10,height=10,left=-1000')
      if (!popup)
        return null
      const pureWindow = popup
      setTimeout(() => popup.close(), 100)
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 24,
    label: 'javascript: URI Sync Execution (伪协议时序攻击)',
    category: 'bypass',
    creator: (container) => {
      const iframe = document.createElement('iframe')
      iframe.src = 'javascript:window.parent.__STOLEN_WINDOW__ = window; ""'
      container.appendChild(iframe)
      // @ts-expect-error ...
      const pureWindow = window.__STOLEN_WINDOW__
      // @ts-expect-error ...
      delete window.__STOLEN_WINDOW__
      return pureWindow ? { contentWindow: pureWindow } : null
    },
  },
  {
    id: 26,
    label: 'Call Stack Trace Leak (调用栈深度泄露)',
    category: 'sniffing',
    // 🌟 给函数显式命名，方便在调用栈中精准定位
    creator: function targetCaller(container) {
      try {
        container.appendChild(container)
      } catch (e: any) {
        const stack: string = e.stack || ''
        const lines = stack.split('\n')

        // 寻找我们的业务函数在调用栈里的位置
        const callerIndex = lines.findIndex(line => line.includes(targetCaller.name))
        if (callerIndex > 1) {
          const extraLayers = callerIndex - 1
          return [{
            status: 'fail',
            message: `❌ 抓到 Hook 调用栈了！发现 ${extraLayers} 层异常的中间拦截器:\n${lines.slice(0, callerIndex + 1).join('\n')}`,
          }]
        }
      }
      return { contentWindow: window }
    },
  },
  {
    id: 27,
    label: 'Cross-Realm toString (跨沙箱 toString 穿透)',
    category: 'sniffing',
    creator: () => {
      const sandbox = document.createElement('iframe')
      sandbox.style.display = 'none'
      document.documentElement.appendChild(sandbox)

      // @ts-expect-error 直接访问沙箱的 Function.prototype.toString
      const pureToString = sandbox.contentWindow?.Function.prototype.toString
      sandbox.remove()

      if (pureToString) {
        const exposedStr = pureToString.call(document.appendChild)
        if (!exposedStr.includes('[native code]')) {
          // 🚨 跨域照妖镜识破伪装！
          return [{ status: 'fail', message: `❌ 跨沙箱 toString 穿透暴露了真实源码:\n${exposedStr}` }]
        }
      }
      return { contentWindow: window }
    },
  },
  {
    id: 28,
    label: 'Execution Time Profiling (微秒级性能压测)',
    category: 'sniffing',
    creator: (container) => {
      const frag = document.createDocumentFragment()
      for (let i = 0; i < 500; i++) {
        frag.appendChild(document.createElement('div'))
      }

      const start = performance.now()
      container.appendChild(frag)
      const end = performance.now()
      const duration = end - start

      if (duration > 15) { // 原生通常 < 3ms
        // 🚨 性能异常熔断！
        return [{ status: 'fail', message: `❌ 性能压测未通过！被 Hook 后 appendChild 耗时暴增至: ${duration.toFixed(2)}ms` }]
      }
      return { contentWindow: window }
    },
  },
  {
    id: 29,
    label: 'Built-in Prototype Leak (内置方法调用泄露)',
    category: 'sniffing',
    creator: function builtInMethodSniffer(container) {
      let isLeaked = false
      const originalSplit = String.prototype.split
      const originalSlice = Array.prototype.slice

      // 1. 红队布置陷阱：劫持全局内置方法
      String.prototype.split = function (this: string, separator: any, limit?: number) {
        if (this && this.includes('HierarchyRequestError')) {
          isLeaked = true
        }
        return originalSplit.call(this, separator, limit)
      }

      Array.prototype.slice = function (this: any[], start?: number, end?: number) {
        if (this.length > 0 && typeof this[0] === 'string' && this[0].includes('HierarchyRequestError')) {
          isLeaked = true
        }
        return originalSlice.call(this, start, end)
      }

      try {
        // 2. 踩雷：触发底层异常。
        // 原生 C++ 报错绝对不会经过 JS 的 split/slice
        container.appendChild(container)
      } catch {
      } finally {
        String.prototype.split = originalSplit
        Array.prototype.slice = originalSlice
      }

      // 4. 结算收网
      if (isLeaked) {
        return [{
          status: 'fail',
          message: `❌ 抓到内置方法泄露！防守方在异常抛出阶段调用了 String.prototype.split 或 Array.prototype.slice`,
        }]
      }

      return { contentWindow: window }
    },
  },
  {
    id: 99,
    label: 'Getter Stealth Check (终极嗅探)',
    category: 'bypass',
    creator: () => {
      const iframeProto = HTMLIFrameElement.prototype
      const desc = Object.getOwnPropertyDescriptor(iframeProto, 'contentWindow')
      const getterStr = Function.prototype.toString.call(desc?.get)
      if (!getterStr.includes('[native code]')) {
        return null
      }
      return { contentWindow: window }
    },
  },
]
