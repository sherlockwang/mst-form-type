import { TParamsObject, TProps, TValidator, TValidatorType, TFormatValidators } from './form'

export const isRegExp = (v: RegExp) => {
  return Object.prototype.toString.call(v) === '[object RegExp]'
}

export const formatProps = (params: TParamsObject): TProps => {
  const props: TProps = {}

  for (const key in params) {
    props[key] = params[key].default
  }

  return props
}

export const formatValidators = (params: TParamsObject): TFormatValidators => {
  const validators: TFormatValidators = {}

  for (const key in params) {
    const validator: TValidator = params[key].validator || null
    let type: TValidatorType

    if (validator === 'required') {
      type = 'required'
    } else if (typeof validator === 'function') {
      type = 'func'
    } else if (isRegExp(validator)) {
      type = 'regex'
    } else {
      type = null
    }

    validators[key] = { type, validator: validator }
  }

  return validators
}
