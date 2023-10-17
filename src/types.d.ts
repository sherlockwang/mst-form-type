export type TValidator = 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null

export type TValue = string | boolean | number | Record<string, string> | Array<any>

type TCallback = (arg) => any

export type TError = { key: string; msg: string }

interface FieldSchema {
  id: string
  type?: 'string' | 'number' | 'object' | 'array' | 'boolean'
  default: TValue
  validator?: TValidator
  msg?: string
}

interface DynamicFields {
  id: string
  limit: number
  schema: FieldSchema | FieldSchema[]
  default: Array<Record<string, TValue>>
  onAdd?: (arg) => any
  onRemove?: (id: string) => any
  onEdit?: (key: string) => void
}

interface FormSchema {
  static: FieldSchema[]
  dynamic?: DynamicFields[]
}

export interface IField {
  id: string
  value?: TValue
  default: TValue
  validator?: TValidator
  msg?: string
}

export interface IGroup {
  id: string
  limit: number
  schema: Array<IField>
  default: Array<Record<string, TValue>>
  onAdd?: TCallback
  onRemove?: TCallback
  onEdit?: TCallback
}

export type TStaticParams = {
  [key: string]: IField
}

export type TParams = {
  static: IField[]
  dynamic?: IGroup[]
}

export type TProps = { [key: string]: string | number | unknown }

export type TDynamicField = { [key: string]: string | number | unknown }
