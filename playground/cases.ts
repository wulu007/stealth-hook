import type { TestCase } from './types'
import { DetectionError } from './types'

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

export const stealthTests: TestCase[] = [
  {
    id: 1,
    label: '检查 toString 伪装 (Native Code)',
    category: 'basic',
    creator: () => {
      const original = window.Audio
      const toStringStr = original.toString()
      if (!/^function Audio\(\) \{ \[native code\] \}$/.test(toStringStr)) {
        throw new DetectionError(`✅ toString 伪装成功防守: ${toStringStr}`, 'detection')
      }
    },
  },
  {
    id: 2,
    label: '检查原型链闭环 (prototype.constructor)',
    category: 'advanced',
    creator: () => {
      const Target = window.Date
      if (Target.prototype.constructor !== Target) {
        throw new Error('原型链断裂：constructor 指向不一致')
      }
      const desc = Object.getOwnPropertyDescriptor(Target.prototype, 'constructor')
      if (desc?.enumerable === true) {
        throw new Error('原型 constructor 不应被枚举')
      }
    },
  },
  {
    id: 3,
    label: '自有属性检测 (hasOwnProperty)',
    category: 'bypass',
    creator: () => {
      // 函数对象本身不应该拥有 constructor 属性（它应该在原型链上）
      if (Object.prototype.hasOwnProperty.call(window.Audio, 'constructor')) {
        throw new DetectionError('检测到自有 constructor 属性，潜行失败', 'bypass')
      }
      // 常见的混淆器会在这里翻车
    },
  },
  {
    id: 4,
    label: '属性描述符精确匹配',
    category: 'modern',
    creator: () => {
      const desc = Object.getOwnPropertyDescriptor(window, 'Audio')
      if (!desc)
        throw new DetectionError('找不到描述符', 'detection')

      // 比如：window.Audio 应该是不可枚举的
      if (desc.enumerable !== false) {
        throw new DetectionError('enumerable 状态被篡改', 'detection')
      }
    },
  },
  {
    id: 5,
    label: 'new.target 继承链与原型映射检测',
    category: 'advanced',
    creator: () => {
      // 1. 定义一个用于检测的子类（或伪造一个 new.target）
      function DetectorTarget() {}
      // 必须建立原型关联，否则原生构造函数（如 Audio）会报错
      DetectorTarget.prototype = Object.create(window.Audio.prototype)
      const instance = Reflect.construct(window.Audio, [], DetectorTarget)
      // 3. 验证原型链
      const actualProto = Object.getPrototypeOf(instance)
      if (actualProto !== DetectorTarget.prototype) {
        if (actualProto === window.Audio.prototype) {
          throw new DetectionError('检测到 Opaque Hook：new.target 转发丢失，实例原型指向了基类', 'bypass')
        }
        throw new DetectionError('new.target 行为异常：实例原型未正确链接', 'detection')
      }

      // 4. 验证 constructor 完整性
      // 在 subclassing 场景下，instance.constructor 应当依然能回溯到 window.Audio (即你的 Hook)
      // 但如果 Hook 没处理好 .prototype.constructor，这里会暴露
      if (!(instance instanceof window.Audio)) {
        throw new DetectionError('instanceof 校验失败：Hook 破坏了子类继承关系', 'bypass')
      }
    },
  },
  {
    id: 6,
    label: 'iframe 隔离环境穿透',
    category: 'dom',
    creator: async (container) => {
      const iframe = document.createElement('iframe')
      container.appendChild(iframe)
      const childWin = iframe.contentWindow
      if (!childWin)
        throw new DetectionError('无法访问 iframe 环境', 'detection')
      // @ts-expect-error 直接访问子窗口的 Audio 构造函数
      const isHooked = childWin.Audio.toString().includes('[native code]')
      if (!isHooked) {
        throw new DetectionError('iframe 子环境中 Audio 构造函数未被正确防守', 'detection')
      }
    },
  },
  {
    id: 7,
    label: 'Date 构造函数行为深度检测 (new vs call)',
    category: 'advanced',
    creator: () => {
      const Target = window.Date
      // 1. 检测 new.target 转发：new 调用必须返回对象
      const instance = new Target()
      if (typeof instance !== 'object' || !(instance instanceof Target)) {
        throw new DetectionError('new Target() 未返回正确实例或 instanceof 失效')
      }
      // 2. 检测函数调用：不带 new 调用必须返回字符串 (ES 规范)
      const str = String(new Date())
      if (typeof str !== 'string') {
        throw new DetectionError('Target() 作为函数调用时未返回字符串')
      }

      // 3. 物理原型链检测
      if (Object.getPrototypeOf(instance) !== Target.prototype) {
        throw new DetectionError('实例原型链被劫持：getPrototypeOf(instance) !== Target.prototype')
      }

      // 4. 构造函数属性的不可枚举性 (再次确认)
      const desc = Object.getOwnPropertyDescriptor(Target.prototype, 'constructor')
      if (desc?.value !== Target) {
        throw new DetectionError('闭环断裂：Target.prototype.constructor !== Target')
      }
      if (desc?.enumerable === true) {
        throw new DetectionError('特征泄露：Target.prototype.constructor 变为可枚举')
      }
    },
  },
]
