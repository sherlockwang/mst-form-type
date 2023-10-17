# MST Form Type

This is a tiny custom Mobx State Tree type to handle common forms. It create a new custom `types.model` based on form schema. If no error happens, it will return all fields values in Key-Value object via `submit()` action. It will hold the last valid submission, as well as the last error. The package is easy to understand, and hope it can save some effort.

## V2 update

1. Schema change. Old schema is still supported, but will be format to new schema under the table. So I recommend to use new schema, which is also more clear. See example:

```javescript
// Old
const schema = {
  [key: string]: {
    default: string | number
    validator?: 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null
  }
}

// New
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
```

2. Support dynamic field form with 1 level. Every dynamic field will be assigned a self increaing id. See example:

```javescript
const dynamicForm: FormSchema = {
  static: [
    {
      id: 'name',
      default: '',
      validator: 'required',
    },
    {
      id: 'des',
      default: '',
    },
  ],
  dynamic: [
    {
      id: 'price', // group id
      limit: 100,
      schema: [
        {
          id: 'itemName',
          default: '',
          validator: 'required',
        },
        {
          id: 'itemPrice',
          default: 10,
        },
      ],
      default: [
        {
          itemName: 'itemName1',
          itemPrice: 5,
        },
        {
          itemName: 'itemName2',
          itemPrice: 20,
        },
      ],
      onAdd: i => {
        console.log('add', i)
      },
      onRemove: i => {
        console.log('remove', i)
      },
      onEdit: key => {
        console.log('edit', key)
      },
    },
  ],
}

// render dynamic fields
model.dynamicForm['price'].fields.map(fields => ({ ... }))

// field action
model.dynamicForm.onAdd('price') // this will use field default value in schema
model.dynamicForm.onRemove('price', fields.id)

// form action
model.dynamicForm.submit()
model.dynamicForm.reset()
model.dynamicForm.clear('price') // this will clear all dynamic fields, including default ones
```

3. Remove `initVal` action, now init form by schema, and use reset to set form to init values.

## Install

`npm install -S mst-form-type`

## Usage

```javescript
import createForm from 'mst-form-type'

const schema = {
  static: FieldSchema[]
  dynamic?: DynamicFields[]
}

const Main = types.model('Main', {
  form: createForm(schema, 'name?')
  ...
})

// change field value
form.setValue({ key, value })
// change dynamic field value
form.setDynamicValue({ groupId, id, key, value })
// submit form
form.submit() => { key1: value1, key2: value2, ... }
```

## APIs

### schema

**See V2 Update section for schema change**

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

**`setValue(value)`**

The key method to set field value on field instance.

**`setValue({ key, value })`**

The key method to set field value on form instance. It is used to set static field value. `_internalStatus` is reserved.

**`setDynamicValue({ groupId, id, key, value })`**

The key method to set field value on form instance. Each dynamic field has a field group id and a field id. It is used to set dynamic field value. Or you can use the `setValue` action on instance to do the same job.

`valid()`

It will run all validators in schema with current field values. Usually you don't need to call it manually. It will be called in `submit()`, and produce `error` if any error happens.

**`submit()`**

It will return all field values if passed validation in Key-Value format object. The last valid submission will be hold in `submission` props.

**The method will not submit the form in any form of action. It only output the form current values. You need to handle to real submission action yourself.**

`reset()`

It will set the form type to `init` status, clearing submissions and errors. All fields will be set to default values passed by schema.
