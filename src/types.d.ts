export type TValidator = 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null

export type TValue = string | boolean | number | Record | Array

type TCallback = (arg) => any

export type TError = { key: string; msg: string }
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
