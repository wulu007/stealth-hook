export interface TestLog {
  status: 'pass' | 'fail' | 'warn'
  message: string
}

export interface TestCase {
  id: number
  label: string
  category: 'basic' | 'dom' | 'advanced' | 'tags' | 'modern' | 'bypass' | string
  timeout?: number
  creator: (container: HTMLElement) => Promise<any> | any
}

/**
 * 自定义异常：在检测到问题时抛出
 * 用于区分预期的检测失败 vs. 意外的测试错误
 */
export class DetectionError extends Error {
  constructor(
    message: string,
    public readonly type: 'detection' | 'bypass' | 'sniffing' = 'detection',
  ) {
    super(message)
    this.name = 'DetectionError'
    // 确保 instanceof 正确工作
    Object.setPrototypeOf(this, DetectionError.prototype)
  }
}
