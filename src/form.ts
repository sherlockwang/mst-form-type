import { types, Instance } from 'mobx-state-tree'
import { formatProps, formatValidators } from './utils'
import { TParamsObject, TProps, TFormatValidators } from './types'

const baseForm = types
  .model('BaseForm')
  .props({
    internalStatus: types.optional(
      types.enumeration(['init', 'pending', 'success', 'error']),
      'init'
    ), // pending, error, success
    submission: types.frozen({}),
    error: types.frozen([]),
  })
  .views(self => ({
    get loading() {
      return self.internalStatus === 'pending'
    },
  }))
  .actions(self => {
    let defaultValues: TProps
    let validators: TFormatValidators

    return {
      init(params: TParamsObject) {
        self.internalStatus = 'init'

        defaultValues = formatProps(params)
        validators = formatValidators(params)

        for (const key in defaultValues) {
          // @ts-ignore
          self[key] = defaultValues[key]
        }
      },
      setValue({ key, value }: { key: string; value: string | number | unknown }) {
        if (key !== 'internalStatus') {
          // @ts-ignore
          self[key] = value
        } else {
          console.warn('internalStatus is preserved')
        }
      },
      valid() {
        const error = []

        for (const key in validators) {
          const field = validators[key]

          if (field.type === 'func') {
            // @ts-ignore
            if (!validators[key].validator(self[key])) {
              error.push({ key, error: `${key} doesn't pass validator function.` })
            }
          } else if (field.type === 'required') {
            // @ts-ignore
            if (!self[key]) {
              error.push({ key, error: `${key} is missing.` })
            }
          } else if (field.type === 'regex') {
            // @ts-ignore
            if (!validators[key].validator.test(self[key])) {
              error.push({ key, error: `${key} doesn't match validation regex.` })
            }
          }
        }

        self.error = error

        if (error.length) {
          self.internalStatus = 'error'
        } else {
          self.internalStatus = 'pending'
        }
      },
      submit() {
        // @ts-ignore
        self.valid()

        if (self.internalStatus === 'error') {
          console.error('form has error')

          return self.error
        }

        const output: TProps = {}

        for (const key in defaultValues) {
          // @ts-ignore
          output[key] = self[key]
        }

        self.internalStatus = 'success'
        self.submission = output

        return self.submission
      },
      reset() {
        self.internalStatus = 'init'
        self.submission = {}
        self.error = []

        for (const key in defaultValues) {
          // @ts-ignore
          self[key] = defaultValues[key]
        }
      },
    }
  })

const createForm = (params: TParamsObject, name?: string) => {
  const props = formatProps(params)

  const Form = baseForm
    .named(name)
    //@ts-ignore
    .props({
      ...props,
    })
    .actions(self => ({
      afterCreate() {
        self.init(params)
      },
    }))

  return types.optional(Form, {})
}

export default createForm

type IBaseForm = Instance<typeof baseForm>

export type IForm = IBaseForm & TProps
