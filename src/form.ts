import { types, Instance, flow } from 'mobx-state-tree'

type RequestFunc = (...args: any[]) => Promise<any[] | any>

type ErrorHandlerFunc = (...args: any) => void

type RequestParams = {
  [key: string]: any
  controller?: AbortController
}

const Request = types
  .model('Request')
  .props({
    token: '',
    status: types.optional(
      types.enumeration(['init', 'pending', 'success', 'error', 'canceled']),
      'init'
    ),
    data: types.frozen([]),
    error: types.frozen({}),
  })
  .views(self => ({
    get loading() {
      return self.status === 'pending'
    },
  }))
  .actions(self => {
    let request: RequestFunc
    let errHandler: ErrorHandlerFunc = (err: any) => console.error(err)
    let hasSpecificCancel = false
    let controller: AbortController
    let prevParams: RequestParams = {} as RequestParams
    let oneTime = false

    return {
      // not necessary, if used, must be called before set
      option({ id, once = false }: { id?: string; once?: boolean }) {
        self.token = id ?? ''
        oneTime = once
      },
      set(reqFunc: RequestFunc, rejFunc?: ErrorHandlerFunc) {
        if (oneTime && request) {
          console.warn('This Request model has already been set.')
          return
        }
        // @ts-ignore
        self.reset()
        request = reqFunc
        errHandler = rejFunc ?? errHandler
      },
      // by default, Request model doesn't provide a default cancel controller
      setCancel(cancel: AbortController) {
        hasSpecificCancel = true
        controller = cancel ?? new AbortController()
      },
      fetch: flow(function* (params?: RequestParams) {
        if (typeof request !== 'function') {
          throw new Error('Please set request function first')
        }

        if (self.status === 'pending') return

        self.status = 'pending'

        if (params) {
          prevParams = { ...params }
        }

        if (hasSpecificCancel) {
          prevParams.controller = controller
        }

        try {
          self.data = yield request(prevParams)
          self.status = 'success'
        } catch (error) {
          self.error = error as any
          self.status = 'error'
          self.data = []

          errHandler(error)
        }
      }),
      cancel() {
        if (controller) {
          controller.abort()
          self.status = 'canceled'
        } else {
          console.warn('You need to set a controller first to cancel')
        }
      },
      refetch: flow(function* () {
        if (controller) {
          // @ts-ignore
          self.cancel()
        }

        self.data = []
        // @ts-ignore
        yield self.fetch()
      }),
      reset() {
        self.status = 'init'
        self.data = []
        self.error = null
      },
    }
  })

export default types.optional(Request, {
  status: 'init',
  data: [],
  error: null,
})

export type IRequest = Instance<typeof Request>
