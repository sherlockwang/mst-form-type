export type TValidator = 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null

export type TValidatorType = 'required' | 'func' | 'regex' | null

export type TParamsObject = {
  [key: string]: {
    default: string | number | unknown
    validator?: TValidator
  }
}

export type TProps = { [key: string]: string | number | unknown }

export type TFormatValidators = {
  [key: string]: { type: TValidatorType; validator: TValidator }
}
