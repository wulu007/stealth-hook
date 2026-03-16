import type { TestLog } from './types'

// 分组数据结构
interface TestGroup {
  categoryName: string
  suiteName: string
  results: Array<{ label: string, logs: TestLog[] }>
}

const testGroups: Map<string, TestGroup> = new Map()

// 清空所有结果
export function clearReports() {
  const container = document.getElementById('results')
  if (container) {
    container.innerHTML = ''
  }
  testGroups.clear()
}

// 设置全局状态
export function setGlobalStatus(status: string) {
  const el = document.getElementById('global-status')
  if (el) {
    el.textContent = status
  }
}

// 添加单个测试结果到分组
export function renderReport(label: string, logs: TestLog[], groupKey?: string) {
  const key = groupKey || 'default'

  if (!testGroups.has(key)) {
    testGroups.set(key, {
      categoryName: key,
      suiteName: key === 'default' ? 'Main Window' : key,
      results: [],
    })
  }

  const group = testGroups.get(key)!
  // const hasErrors = logs.some(log => log.status === 'fail')
  // const overallStatus = hasErrors ? 'fail' : 'pass'

  group.results.push({ label, logs })

  // 每次添加结果后，重新渲染整个分组
  renderAllGroups()
}

// 渲染所有分组
function renderAllGroups() {
  const container = document.getElementById('results')
  if (!container) {
    console.error('Test container #results not found!')
    return
  }

  // 清空容器
  container.innerHTML = ''

  for (const [_, group] of testGroups) {
    renderGroup(container, group)
  }
}

function renderGroup(container: HTMLElement, group: TestGroup) {
  const groupDiv = document.createElement('div')
  groupDiv.className = 'test-group'

  // 统计
  const passCount = group.results.filter(r =>
    !r.logs.some(log => log.status === 'fail'),
  ).length
  const failCount = group.results.filter(r =>
    r.logs.some(log => log.status === 'fail'),
  ).length

  // 组头
  const header = document.createElement('div')
  header.className = 'group-header'
  header.innerHTML = `
    <span>${group.suiteName}</span>
    <span class="group-stats">
      <span style="color: #4caf50;">✓ ${passCount}</span>
      <span style="margin-left: 15px; color: #f44336;">✗ ${failCount}</span>
    </span>
  `
  groupDiv.appendChild(header)

  // 测试案例容器
  const casesDiv = document.createElement('div')
  casesDiv.className = 'test-cases'

  for (const { label, logs } of group.results) {
    const caseDiv = createCaseCard(label, logs)
    casesDiv.appendChild(caseDiv)
  }

  groupDiv.appendChild(casesDiv)
  container.appendChild(groupDiv)
}

function createCaseCard(label: string, logs: TestLog[]): HTMLElement {
  const div = document.createElement('div')

  // 判断整体状态
  const hasErrors = logs.some(log => log.status === 'fail')
  const overallStatus = hasErrors ? 'fail' : 'pass'

  div.className = `case ${overallStatus}`

  // 构建头部
  let html = `
    <div class="header">
      <strong>${label}</strong>
      <span class="status ${overallStatus}">${overallStatus.toUpperCase()}</span>
    </div>
  `

  // 构建日志列表
  if (logs.length > 0) {
    const logHtml = logs
      .map((log) => {
        let logClass = ''
        if (log.status === 'fail')
          logClass = 'log-error'
        if (log.status === 'warn')
          logClass = 'log-warn'
        if (log.status === 'pass')
          logClass = 'log-ok'

        return `<span class="${logClass}">${log.message}</span>`
      })
      .join('\n')

    html += `<div class="log">${logHtml}</div>`
  } else {
    html += `<div class="log log-ok">No logs generated.</div>`
  }

  div.innerHTML = html
  return div
}
