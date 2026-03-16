import { stealthTests, testCases } from './cases'
import { inspectWindow } from './inspector'
import { testIframe } from './runner'
import { clearReports, renderReport, setGlobalStatus } from './ui'

// 测试组定义
const testSuites = {
  dom: {
    name: 'DOM 防御测试',
    cases: testCases,
  },
  stealth: {
    name: '隐身检测测试',
    cases: stealthTests,
  },
}

async function runAllTests() {
  clearReports()
  setGlobalStatus('Running...')

  // 1. 先查验主窗口 (Main Window)
  const mainLogs = inspectWindow(window, true)
  renderReport('1. Main Window', mainLogs, 'Main Window')

  // 2. 运行 DOM 防御测试
  for (const testCase of testSuites.dom.cases) {
    await testIframe(testCase, 'DOM 防御测试')
  }

  // 3. 运行隐身检测测试
  for (const testCase of testSuites.stealth.cases) {
    await testIframe(testCase, '隐身检测测试')
  }

  setGlobalStatus('Done')
}

// 事件绑定
const runAllBtn = document.getElementById('runAllBtn')
runAllBtn?.addEventListener('click', runAllTests)

// 自动启动测试
setTimeout(runAllTests, 300)
