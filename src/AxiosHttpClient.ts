import {
  CancelError,
  HttpClient,
  HttpError,
  RequestConfig,
  Response,
  Cancel,
  CancelToken,
  RemoveInterceptor
} from '@manzano/http-client'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

export class AxiosHttpClient extends HttpClient<AxiosInstance> {
  constructor(config?: AxiosRequestConfig) {
    super(Axios.create(config))
  }

  private static isAxiosError(error: any): error is AxiosError {
    return !!error && error['isAxiosError'] === true
  }

  private static throwFinalError(error: any) {
    if (Axios.isCancel(error)) {
      throw new CancelError('Request cancelled')
    }

    if (AxiosHttpClient.isAxiosError(error)) {
      const { config, request, response, code } = error

      throw new HttpError(config, response, code, request)
    }

    throw error
  }

  async exchange<T = any>(config: RequestConfig): Promise<Response<T>> {
    try {
      return await this.delegate.request<T>(config)
    } catch (error) {
      return AxiosHttpClient.throwFinalError(error) as never
    }
  }

  addResponseInterceptor(
    onSuccess?: (response: Response) => Response | Promise<Response>,
    onError?: (error: any) => Response | Promise<Response>
  ): RemoveInterceptor {
    const errorHandler =
      onError &&
      ((error: any) => {
        const errorResult = onError(error)

        return errorResult instanceof Promise
          ? errorResult.catch(AxiosHttpClient.throwFinalError)
          : errorResult
      })

    const interceptorId = this.delegate.interceptors.response.use(
      onSuccess,
      errorHandler
    )

    return () => {
      this.delegate.interceptors.response.eject(interceptorId)
    }
  }

  addRequestInterceptor(
    onSuccess?: (
      response: RequestConfig
    ) => RequestConfig | Promise<RequestConfig>,
    onError?: (error: any) => RequestConfig | Promise<RequestConfig>
  ): RemoveInterceptor {
    const interceptorId = this.delegate.interceptors.request.use(
      onSuccess,
      onError
    )

    return () => {
      this.delegate.interceptors.request.eject(interceptorId)
    }
  }

  createCancelToken(): [CancelToken, Cancel] {
    const cancelTokenSource = Axios.CancelToken.source()
    const { token, cancel } = cancelTokenSource

    return [token, cancel]
  }
}
