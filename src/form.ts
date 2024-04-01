import { types, Instance, getSnapshot } from 'mobx-state-tree'
import {
  TParams,
  TProps,
  TValidator,
  IField,
  TValue,
  IGroup,
  TError,
  TStaticParams,
  TDynamicField,
} from './types.d'

const isRegExp = (v: RegExp) => {
  return Object.prototype.toString.call(v) === '[object RegExp]'
}

const valueType = types.union(
  types.boolean,
  types.string,
  types.number,
  types.frozen({}),
  types.frozen([])
)

const fieldModel = types
  .model('Field')
  .props({
    id: types.identifier,
    default: valueType,
    value: valueType,
    msg: 'The input is invalid',
  })
  .views(self => ({
    get invalid() {
      // @ts-ignore
      return !self.valid(self.value)
    },
  }))
  .actions(self => {
    let validator: (arg: TValue) => boolean = null

    return {
      setValidator(rawValidator: TValidator) {
        if (rawValidator === 'required') {
          validator = val => !!val
        } else if (typeof rawValidator === 'function') {
          validator = rawValidator
        } else if (isRegExp(rawValidator)) {
          validator = validator = val => rawValidator.test(val as string)
        }
      },
      init(field: IField) {
        self.default = self.default || field.default
        // @ts-ignore
        self.setValue(self.default || field.default)
        // @ts-ignore
        self.setValidator(field.validator)

        if (field.msg) {
          // @ts-ignore
          self.setErrorMsg(field.msg)
        }
      },
      setErrorMsg(msg: string) {
        self.msg = msg
      },
      valid(val = self.value): boolean {
        if (validator) {
          return validator(val as TValue)
        }
        return true
      },
      setValue(val: TValue) {
        self.value = val
      },
      reset() {
        self.value = self.default
      },
      clear() {
        self.value = null
      },
    }
  })

type TFieldModel = typeof fieldModel
type IstFieldModel = Instance<typeof fieldModel>

const baseForm = types
  .model('BaseForm')
  .props({
    _internalStatus: types.optional(
      types.enumeration(['init', 'pending', 'success', 'error']),
      'init'
    ),
    submission: types.frozen({}),
    error: types.frozen([]),
  })
  .views(self => ({
    get loading() {
      return self._internalStatus === 'pending'
    },
  }))
  .actions(self => {
    let staticFields: IField[] = []
    let dynamicGroups: IGroup[] = []

    return {
      init(params: TParams) {
        self._internalStatus = 'init'

        staticFields = params.static

        staticFields.forEach(field => {
          // @ts-ignore
          self[field.id].init(field)
        })

        if (params.dynamic) {
          dynamicGroups = params.dynamic

          dynamicGroups.forEach(group => {
            // @ts-ignore
            const groupModel = self[group.id]

            group.default?.forEach(item => {
              groupModel.addFields(item, true)
            })
          })
        }
      },
      setValue({ key, value }: { key: string; value: string | number | unknown }) {
        if (key !== '_internalStatus') {
          // @ts-ignore
          self[key].setValue?.(value)
        } else {
          console.warn('_internalStatus is preserved')
        }
      },
      setDynamicValue({
        groupId,
        id,
        key,
        value,
      }: {
        groupId: string
        id: string
        key: string
        value: string | number | unknown
      }) {
        if (key !== '_internalStatus') {
          // @ts-ignore
          const groupModel = self[groupId]
          groupModel.editField(id, key, value)
        } else {
          console.warn('_internalStatus is preserved')
        }
      },
      valid() {
        const formError: TError[] = []

        staticFields.forEach(field => {
          // @ts-ignore
          if (!self[field.id].valid()) {
            // @ts-ignore
            formError.push({ key: field.id, msg: self[field.id]?.msg })
          }
        })

        dynamicGroups.forEach(group => {
          // @ts-ignore
          const { id, error } = self[group.id].valid()

          if (error.length) {
            formError.push({ key: id, error })
          }
        })

        if (formError.length) {
          self._internalStatus = 'error'
        } else {
          self._internalStatus = 'pending'
        }

        self.error = formError

        return formError
      },
      submit() {
        // @ts-ignore
        self.valid()

        if (self._internalStatus === 'error') {
          console.error('form has error')

          return self.error
        }

        const output: TProps = {}

        staticFields.forEach(field => {
          // @ts-ignore
          output[field.id] = self[field.id].value
        })

        dynamicGroups.forEach(group => {
          // @ts-ignore
          output[group.id] = self[group.id].getValues()
        })

        self._internalStatus = 'success'
        self.submission = output

        return output
      },
      reset() {
        self._internalStatus = 'init'
        self.submission = {}
        self.error = []

        staticFields.forEach(field => {
          // @ts-ignore
          self[field.id].reset()
        })

        dynamicGroups.forEach(group => {
          // @ts-ignore
          self[group.id].reset()
        })
      },
    }
  })

const baseGroup = types
  .model('BaseDynamicGroup')
  .props({
    id: types.identifier,
    fields: types.frozen([]),
    counter: 0,
    size: 0,
    limit: -1,
  })
  .actions(self => {
    return {
      getValues() {
        const values = getSnapshot(self.fields).map((i: IField) => {
          const output: TProps = {}

          Object.keys(i).forEach(key => {
            if (key === 'id') {
              output[key] = i[key]
            } else {
              // @ts-ignore
              output[key] = i[key].value
            }
          })

          return output
        })

        return values
      },
      valid() {
        const error: TError[] = []

        self.fields.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key !== 'id') {
              const field: IstFieldModel = item[key]

              if (!field.valid()) {
                error.push({ key: field.id, msg: field.msg })
              }
            }
          })
        })

        return {
          id: self.id,
          error,
        }
      },
      reset() {
        self.fields.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key !== 'id') {
              item[key].reset()
            }
          })
        })
      },
      addFields(id: string, groupFieldProps: Record<string, TFieldModel>, newItem: TDynamicField) {
        const pendingAddItem = { id }

        Object.entries(groupFieldProps).forEach(([key]: [string, TFieldModel]) => {
          // @ts-ignore
          pendingAddItem[key] = {
            id: `${id}--${key}`,
            value: newItem[key] || '',
            default: newItem[key] || '',
          }
        })

        self.fields.push(pendingAddItem)

        self.size++

        return self.fields[self.size - 1]
      },
      removeFields(id: string) {
        if (self.size > 0) {
          const pendingRemoveIdx = self.fields.findIndex(i => i.id === id)
          const removeItem: TDynamicField = {}

          Object.keys(getSnapshot(self.fields[pendingRemoveIdx])).forEach(key => {
            if (key === 'id') {
              removeItem[key] = self.fields[pendingRemoveIdx][key]
            } else {
              removeItem[key] = self.fields[pendingRemoveIdx][key].value
            }
          })

          self.fields.splice(pendingRemoveIdx, 1)
          self.size--

          return removeItem
        }
        return null
      },
      editField(id: string, fieldKey: string, value: TValue) {
        const pendingEditItem: TFieldModel = self.fields.find(i => i.id === id)
        // @ts-ignore
        pendingEditItem[fieldKey].setValue(value)

        return pendingEditItem
      },
      clearField() {
        self.fields.length = 0
        self.size = 0
      },
    }
  })

type TBaseGroupModel = typeof baseGroup

const formatParams = (params: TParams | TStaticParams) => {
  let output: TParams = { static: [] }
  const keyArr = Object.keys(params)

  if (keyArr.includes('dynamic') && !keyArr.includes('static')) {
    keyArr.forEach(key => {
      if (key === 'dynamic') {
        output.dynamic = params[key] as IGroup[]
      } else {
        // @ts-ignore
        output.static.push(params[key])
      }
    })
  } else if (!keyArr.includes('dynamic') && !keyArr.includes('static')) {
    keyArr.forEach(key => {
      // @ts-ignore
      output.static.push({ id: key, ...params[key] })
    })
  } else {
    // @ts-ignore
    output = { ...params }
  }

  return output
}

const prepareFormModel = (params: TParams) => {
  const initData: Record<string, IField | {}> = {}
  const staticFieldProps: Record<string, TFieldModel> = {}
  const dynamicFieldProps: Record<string, TBaseGroupModel> = {}

  params.static.forEach((field: IField) => {
    initData[field.id] = {
      id: field.id,
      value: field.default,
      default: field.default,
      msg: field.msg,
    }

    staticFieldProps[field.id] = fieldModel
  })

  if (params.dynamic?.length) {
    params.dynamic.forEach((fieldGroup: IGroup) => {
      initData[fieldGroup.id] = {}

      // every group's field
      const groupFieldProps: Record<string, TFieldModel> = {}
      const groupFieldInit: Record<string, IField> = {}

      fieldGroup.schema.forEach(field => {
        groupFieldProps[field.id] = fieldModel
        groupFieldInit[field.id] = field
      })

      dynamicFieldProps[fieldGroup.id] = baseGroup
        .named(fieldGroup.id.toUpperCase())
        .props({
          id: fieldGroup.id,
          fields: types.array(
            types.model({
              id: types.identifier,
              ...groupFieldProps,
            })
          ),
          limit: fieldGroup.limit,
        })
        .actions(self => {
          const baseAddField = self.addFields
          const baseRemoveField = self.removeFields
          const baseEditField = self.editField

          return {
            addFields(i, isInit = false) {
              if (self.limit !== -1 && self.size < self.limit) {
                const id = i.id || `${self.id}-${self.counter++}`

                const newField = baseAddField(id, groupFieldProps, i)

                Object.keys(groupFieldProps).forEach(key => {
                  newField[key].init(groupFieldInit[key])
                })

                if (!isInit) {
                  fieldGroup?.onAdd({ id, ...i })
                }

                return id
              }
              console.warn('reach dynamic field limit')
              return null
            },
            removeFields(id) {
              const removeItem = baseRemoveField(id)
              fieldGroup?.onRemove(removeItem)
            },
            editField(id: string, fieldKey: string, value) {
              const editItem = baseEditField(id, fieldKey, value)
              fieldGroup?.onEdit(editItem)
            },
          }
        })
    })
  }

  return {
    initData,
    staticFieldProps,
    dynamicFieldProps,
  }
}

const createForm = (rawParams: TParams | TStaticParams, name?: string) => {
  const params = formatParams(rawParams)
  const { initData, staticFieldProps, dynamicFieldProps } = prepareFormModel(params)

  const Form = baseForm
    .named(name)
    .props({
      ...staticFieldProps,
      ...dynamicFieldProps,
    })
    .actions(self => {
      const actions: Record<string, (...args) => any> = {
        afterCreate() {
          self.init(params)
        },
      }

      if (params.dynamic) {
        actions.onAdd = (groupId: string, item = {}) => {
          const groupModel = self[groupId]

          if (groupModel) {
            // @ts-ignore
            groupModel.addFields(item)
          }
        }

        actions.onRemove = (groupId: string, itemId: string) => {
          const groupModel = self[groupId]

          if (groupModel) {
            // @ts-ignore
            groupModel.removeFields(itemId)
          }
        }

        actions.onEdit = (groupId: string, id: string, key: string, value: TValue) => {
          const groupModel = self[groupId]

          if (groupModel) {
            // @ts-ignore
            groupModel.editField(id, key, value)
          }
        }

        actions.clear = (groupId: string) => {
          const groupModel = self[groupId]

          if (groupModel) {
            // @ts-ignore
            groupModel.clearField()
          }
        }
      }

      return actions
    })

  return types.optional(Form, initData)
}

export default createForm

type IstBaseForm = Instance<typeof baseForm>

export type IForm = IstBaseForm & TProps
