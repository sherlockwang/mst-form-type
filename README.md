# MST Form Type

> **Still under construction**

This is a tiny custom mobx-state-tree model type to handle common forms. It create a new custom `types.model` based on form schema to contain all fields, and call validators passed along with every key for validation. If no error happens, it will return all fields values in key-value object via `submit()` action. It will hold last valid submission, as well as last error. Both can be accessed through outside. The package is easy to understand, and hope it can save some effort.

## Install

`npm i mst-form-type -S`

## Usage

```javescript
import createForm from 'mst-form-type'

const schema = {

}

const Main = types.model('Main', {
  form: createForm(schema)
  ...
})
```

## APIs

### props

### actions
