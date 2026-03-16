import type { TestCase, TestLog } from './types'
import { inspectWindow } from './inspector'
import { DetectionError } from './types'
import { renderReport } from './ui'

export async function testIframe(testCase: TestCase, groupKey?: string): Promise<void> {
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
        if (result && typeof result === 'object' && !('then' in result) && (result as any).contentWindow) {
          resolve(inspectWindow((result as any).contentWindow))
          return
        }

        // 处理 Promise 或需要等待 load 的情况
        Promise.resolve(result)
          .then((frame) => {
            // null 表示不支持或需要跳过
            if (frame === null) {
              resolve([{ status: 'warn', message: '⚠️ Skipped or not supported' }])
              return
            }

            // undefined 表示检测通过（没有检测出问题）- 用于隐身检测
            if (frame === undefined) {
              resolve([{ status: 'pass', message: '✅ Detection passed, no issues found' }])
              return
            }

            if (typeof frame !== 'object') {
              resolve([{ status: 'warn', message: '⚠️ Invalid return type' }])
              return
            }

            const frameObj = frame as any
            if (frameObj.contentWindow) {
              resolve(inspectWindow(frameObj.contentWindow))
            } else if (typeof frameObj.addEventListener === 'function') {
              // 挂载 onload 事件
              const check = () => resolve(inspectWindow(frameObj.contentWindow))
              frameObj.addEventListener('load', check, { once: true })
            } else {
              resolve([{ status: 'warn', message: '⚠️ Invalid frame object' }])
            }
          })
          .catch((e: any) => {
            if (e instanceof DetectionError) {
              resolve([{ status: 'fail', message: `🚨 ${e.message}` }])
            } else {
              resolve([{ status: 'fail', message: `❌ Test Error: ${e.message}` }])
            }
          })
      } catch (e: any) {
        // 捕获 creator 阶段抛出的错误
        if (e instanceof DetectionError) {
          resolve([{ status: 'fail', message: `🚨 ${e.message}` }])
        } else {
          resolve([{ status: 'fail', message: `❌ Sync Error: ${e.message}` }])
        }
      }
    })

    // 3. 拿到最终结果，渲染 UI
    renderReport(label, logs, groupKey)
  } finally {
    // 4. 确保沙箱被干净地销毁
    cleanup()
  }
}
