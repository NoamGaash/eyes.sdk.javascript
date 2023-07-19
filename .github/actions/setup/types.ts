export interface Job {
  name: string
  'short-name': string
  'display-name': string
  'package-name': string
  'package-index': number,
  'package-version': string
  'working-directory': string
  runner?: string
  container?: string
  'framework-version'?: string
  'node-version'?: string
  'java-version'?: string
  'python-version'?: string
  'ruby-version'?: string
  'test-type'?: string
  'build-type'?: string
  'setup-type'?: string
  links?: string
  env?: Record<string, string>
  builds?: string[]
  artifacts?: string[]
  key?: string
}

export interface Package {
  index: number,
  name: string
  version: string
  component: string
  path: string
  builds: Record<string, any>[]
  tests: Record<string, any>[]
  releases: Record<string, any>[]
}
