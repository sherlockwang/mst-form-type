# MST Form Type

This is a tiny custom Mobx State Tree type to handle common forms. It create a new custom `types.model` based on form schema. If no error happens, it will return all fields values in Key-Value object via `submit()` action. It will hold the last valid submission, as well as the last error. The package is easy to understand, and hope it can save some effort.

## Install

`npm install -S mst-form-type`

## Usage

```javescript
import createForm from 'mst-form-type'

const schema = {
  [key: string]: {
    default: string | number
    validator?: 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null
  }
}

const Main = types.model('Main', {
  form: createForm(schema, 'name?')
  ...
})

// change field value
form.setValue({ key: 'key', value: 'value' })
// submit form
form.submit() => { key1: value1, key2: value2, ... }
```

## APIs

### schema

```typescript
[key: string]: {
  default: string | number
  validator?: 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null
}
```

`key`

The key of each field in a form. It should be unique and will be used to access field value and in `setValue()` action.

`default`

The default value of a field. It can be `string` or `number`. The Mobx State Tree will decide `prop` type based on the type of this value.

`validator`

This is optional. All validators will be called in `valid()` before `submit()`. 

`'required'` means this field cannot be falsy values, like `0`, `''`, or `undefined`.

`((...args: any[]) => boolean)` means a function return a boolean value. If returned `true`, the validation will be treated passed.

`RegExp` means the value will be used in `RegExp.test()`. If returned `true`, the validation will be treated passed.

`undefined | null` will not be processed.

### props

**fields**

Every key in `schema` will become a field `prop` of form type. The type of each field will be based on `default` value. It is accept `string` or `number` as it covers most form field cases.

**`submission`**

A snapshot of last success submitted form values, in Key-Value object format.

`error`

An object in Key-Value format contains validation error of each field. Will be cleared on every `valid()` call.

`status`

Indicate the form status, has 4 values: `'init', 'pending', 'success', 'error'`. Usually you don't need it, it will change according to form status.

### actions

**default export**

The default exported method will create a new custom `types.model` with all the keys in `schema` as `props` based on a base model type. The new form type will initialize with the schema, and prepare for action. A name can also be passed for tracking. Otherwise, it will show the base model name.

`init()`

It will be called after new custom type created with schema. It will process the schema to get default values and validators. Usually, you don't need to call it manually.

`initVal({ key1: value1, key2: value2, ... })`

It helps init form fields values if you want different default values than schema. 

**The only difference is this method will only set values for existed fields.**

**`setValue({ key, value })`**

The key method to set field value. `internalStatus` is reserved.

`valid()`

It will run all validators in schema with current field values. Usually you don't need to call it manually. It will be called in `submit()`, and produce `error` if any error happens. 

**`submit()`**

It will return all field values if passed validation in Key-Value format object. The last valid submission will be hold in `submission` props.

**The method will not submit the form in any form of action. It only output the form current values. You need to handle to real submission action yourself.**

`reset()`

It will set the form type to `init` status, clearing submissions and errors. All fields will be set to default values passed by schema.
