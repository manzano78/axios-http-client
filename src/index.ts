import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { HttpClient } from '@manzano/http-client'

import { AxiosHttpClient } from './AxiosHttpClient'

export function createAxiosHttpClient(
  config?: AxiosRequestConfig
): HttpClient<AxiosInstance> {
  return new AxiosHttpClient(config)
}
