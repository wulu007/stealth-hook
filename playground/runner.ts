import type { TestCase, TestLog } from './types'
import { inspectWindow } from './inspector'
import { renderReport } from './ui'

export async function testIframe(testCase: TestCase): Promise<void> {
  // 1. 创建沙箱容器
  const stage = document.createElement('div')
  stage.style.cssText = 'position:absolute; top:-9999px; left:-9999px; width:1px; height:1px; overflow:hidden;'
  document.body.appendChild(stage)

  const label = `${testCase.id}. ${testCase.label}`

  // 优雅的清理函数
  let timeoutId: number | ReturnType<typeof setTimeout>
  const cleanup = () => {
    clearTimeout(timeoutId)
    setTimeout(() => stage.remove(), 500) // 延迟清理DOM
  }

  try {
    // 2. 规范的 Promise (同步 executor)
    const logs = await new Promise<TestLog[]>((resolve) => {
      // 设定超时保护
      timeoutId = setTimeout(() => {
        resolve([{ status: 'fail', message: '❌ TIMEOUT: Test hung or failed to load.' }])
      }, testCase.timeout || 2000)

      try {
        const result = testCase.creator(stage)
        if (Array.isArray(result) && result.length > 0 && 'status' in result[0]) {
          resolve(result)
          return
        }

        // 🌟 核心防御测试：绝不能让步！
        // 如果结果是普通对象且带有 contentWindow，立刻当场同步断言！
        if (result && !('then' in result) && result.contentWindow) {
          resolve(inspectWindow(result.contentWindow))
          return
        }

        // 处理 Promise 或需要等待 load 的情况
        Promise.resolve(result)
          .then((frame) => {
            if (!frame) {
              resolve([{ status: 'warn', message: '⚠️ Skipped or not supported' }])
              return
            }

            if (frame.contentWindow) {
              resolve(inspectWindow(frame.contentWindow))
            } else {
              // 挂载 onload 事件
              const check = () => resolve(inspectWindow(frame.contentWindow))
              if (frame.addEventListener) {
                frame.addEventListener('load', check, { once: true })
              } else {
                frame.onload = check
              }
            }
          })
          .catch((e: any) => {
            resolve([{ status: 'fail', message: `❌ Test Error: ${e.message}` }])
          })
      } catch (e: any) {
        // 捕获 creator 阶段抛出的同步错误
        resolve([{ status: 'fail', message: `❌ Sync Error: ${e.message}` }])
      }
    })

    // 3. 拿到最终结果，渲染 UI
    renderReport(label, logs)
  } finally {
    // 4. 确保沙箱被干净地销毁
    cleanup()
  }
}
