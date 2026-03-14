import { testCases } from './cases'
import { inspectWindow } from './inspector'
import { testIframe } from './runner'
import { clearReports, renderReport, setGlobalStatus } from './ui'

async function runAllTests() {
  clearReports()
  setGlobalStatus('Running...')

  // 1. 先查验主窗口 (Main Window)
  // 主窗口不需要 runner，直接 inspect
  const mainLogs = inspectWindow(window, true)
  renderReport('1. Main Window', mainLogs)

  // 2. 依次运行所有测试用例
  for (const testCase of testCases) {
    await testIframe(testCase)
  }

  setGlobalStatus('Done')
}

async function runSelectedTests() {
  const selectElement = document.getElementById('testSelect') as HTMLSelectElement
  const option = selectElement?.value || 'all'

  clearReports()
  setGlobalStatus('Running...')

  // 1. 主窗口
  const mainLogs = inspectWindow(window, true)
  renderReport('1. Main Window', mainLogs)

  if (option === 'main') {
    setGlobalStatus('Done')
    return
  }

  // 2. 根据选择的分类过滤测试用例
  const selectedTests
    = option === 'all' ? testCases : testCases.filter(tc => tc.category === option)

  // 3. 遍历并执行过滤后的测试
  for (const testCase of selectedTests) {
    await testIframe(testCase)
  }

  setGlobalStatus('Done')
}

// 声明全局函数以供 HTML onclick 调用
declare global {
  function runSelectedTests(): Promise<void>
  function runAllTests(): Promise<void>
}

Object.assign(window, { runSelectedTests, runAllTests })

// 事件绑定
const runAllBtn = document.getElementById('runAllBtn')
const runSelectedBtn = document.getElementById('runSelectedBtn')

runAllBtn?.addEventListener('click', runAllTests)
runSelectedBtn?.addEventListener('click', runSelectedTests)

// 自动启动测试
setTimeout(runAllTests, 500)
