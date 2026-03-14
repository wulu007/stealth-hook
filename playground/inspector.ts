import type { TestLog } from './types'

function createLogger(logs: TestLog[]) {
  const prefixes = {
    pass: '✅ ',
    fail: '❌ ',
    warn: '⚠️ ',
  }

  const hasExplicitEmoji = (msg: string) => {
    const s = msg?.trim?.() ?? ''
    return s.startsWith('✅') || s.startsWith('❌') || s.startsWith('⚠')
  }

  return {
    pass: (message: string) => {
      const text = hasExplicitEmoji(message) ? message : `${prefixes.pass}${message}`
      logs.push({ status: 'pass', message: text })
    },
    fail: (message: string) => {
      const text = hasExplicitEmoji(message) ? message : `${prefixes.fail}${message}`
      logs.push({ status: 'fail', message: text })
    },
    warn: (message: string) => {
      const text = hasExplicitEmoji(message) ? message : `${prefixes.warn}${message}`
      logs.push({ status: 'warn', message: text })
    },
  }
}

export function inspectWindow(win: Window | any, isMain = false): TestLog[] {
  const logs: TestLog[] = []
  const logger = createLogger(logs)
  if (!win) {
    logger.fail('Window object is undefined/null')
    return logs
  }

  if (!isMain && win.__HOOKED__ !== true) {
    logger.fail('Hook 被绕过了！没有找到思想钢印 __HOOKED__')
  } else if (!isMain) {
    logger.pass('Hook 成功注入并生效 (思想钢印存在)')
  }

  const targetFunction = win.Function || window.Function
  const pureFn = targetFunction.prototype.toString

  // 2. 基础字符串检查
  try {
    const str = pureFn.call(targetFunction.prototype.toString)
    if (!str.includes('[native code]')) {
      logger.fail(`toString doesn't look native: "${str}"`)
    }
  } catch (e: any) {
    logger.fail(`toString.call threw: ${e.message}`)
  }

  // 3. 上下文错误检查 (防御 proxy 暴露)
  let errorCaught = false
  try {
    pureFn.call(123)
  } catch (e: any) {
    errorCaught = true
    if (e.name !== 'TypeError') {
      logger.fail(`Threw wrong error: ${e.name} (Expected TypeError)`)
    }
  }
  if (!errorCaught) {
    logger.fail(`Hook swallowed error on primitive context!`)
  }

  // 2. 描述符检查
  try {
    const desc = Object.getOwnPropertyDescriptor(win.Function.prototype, 'toString')
    if (!desc) {
      logger.fail(`Descriptor missing`)
    } else if (desc.enumerable) {
      logger.fail(`toString shouldn't be enumerable`)
    } else if (desc.configurable !== true) {
      logger.fail(`toString should be configurable`)
    }
  } catch (e: any) {
    logger.fail(`Descriptor check error: ${e.message}`)
  }

  try {
    const doubleStr = win.Function.prototype.toString.toString()
    if (doubleStr !== 'function toString() { [native code] }') {
      logger.warn(`toString.toString() looks weird: ${doubleStr}`)
    }
  } catch (e: any) {
    logger.fail(`toString.toString() threw: ${e.message}`)
  }

  // 5. 长度和名称
  if (pureFn.length !== 0)
    logger.fail(`Length is ${pureFn.length} (Expected 0)`)
  if (pureFn.name !== 'toString')
    logger.fail(`Name is "${pureFn.name}" (Expected "toString")`)

  return logs
}
