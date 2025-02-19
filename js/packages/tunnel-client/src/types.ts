export interface TunnelClientSettings {
  serviceUrl?: string
}

export interface TunnelClientWorkerSettings extends TunnelClientSettings {
  pollingServerUrl: string
  secret: string
  agentId: string
  pollingTimeout?: number
  timeout?: number
  envInfo?: Record<string, any>
}

export interface TunnelClient {
  list(): Promise<Tunnel[]>
  create(credentials: TunnelCredentials): Promise<Tunnel>
  replace(tunnel: Tunnel): Promise<Tunnel>
  destroy(tunnel: Tunnel): Promise<void>
  close(): Promise<void>
}

export interface TunnelCredentials {
  eyesServerUrl: string
  apiKey: string
}

export interface Tunnel {
  tunnelId: string
  credentials: TunnelCredentials
}
