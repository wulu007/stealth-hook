import type { TestLog } from './types'

// 渲染单个测试用例的结果卡片
export function renderReport(label: string, logs: TestLog[]) {
  const container = document.getElementById('results')
  if (!container) {
    console.error('Test container #results not found!')
    return
  }

  const div = document.createElement('div')

  // 判断整体状态：只要日志里包含一个 fail，整体就是 FAIL
  const hasErrors = logs.some(log => log.status === 'fail')
  const overallStatus = hasErrors ? 'fail' : 'pass'

  div.className = `case ${overallStatus}`

  // 构建头部 (标题 + PASS/FAIL 标签)
  let html = `
    <div class="header">
      <strong>${label}</strong>
      <span class="status ${overallStatus}">${overallStatus.toUpperCase()}</span>
    </div>
  `

  // 构建日志列表
  if (logs.length > 0) {
    const logHtml = logs.map((log) => {
      // 赋予不同的 CSS 类名以实现变色
      let logClass = ''
      if (log.status === 'fail')
        logClass = 'log-error'
      if (log.status === 'warn')
        logClass = 'log-warn'
      if (log.status === 'pass')
        logClass = 'log-ok'

      return `<span class="${logClass}">${log.message}</span>`
    }).join('\n')

    html += `<div class="log">${logHtml}</div>`
  } else {
    // 兜底防御
    html += `<div class="log log-ok">No logs generated.</div>`
  }

  div.innerHTML = html
  container.appendChild(div)
}

// 清空控制台 (每次重新运行测试前调用)
export function clearReports() {
  const container = document.getElementById('results')
  if (container) {
    container.innerHTML = ''
  }
}

export function setGlobalStatus(statusText: string) {
  const statusIndicator = document.getElementById('global-status')
  if (statusIndicator) {
    statusIndicator.textContent = statusText
  }
}
