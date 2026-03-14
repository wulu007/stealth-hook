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
