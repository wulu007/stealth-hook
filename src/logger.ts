export const createLogger = (() => {
  const $log = console.log
  const $warn = console.warn
  const $error = console.error
  return (prefix: string) => ({
    log: (...args: any[]) => $log(`[${prefix}]`, ...args),
    warn: (...args: any[]) => $warn(`[${prefix}]`, ...args),
    error: (...args: any[]) => $error(`[${prefix}]`, ...args),
  })
})()
