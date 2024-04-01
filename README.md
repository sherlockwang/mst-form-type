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

**default export**

The default exported method will generate a new custom types.model with all the fields in the schema as props, based on a base model type. The newly created form type will automatically initialize with the schema upon creation. Optionally, a name can be passed for tracking purposes; otherwise, it will default to the base model name.

```typescript
type TValidator = 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null

type TValue = string | boolean | number | Record<string, string> | Array<any>

interface FieldSchema {
  id: string
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default: TValue
  validator?: TValidator
  msg?: string
}
```

### Field

#### schema

```typescript
type TValidator = 'required' | ((...args: any[]) => boolean) | RegExp | undefined | null

type TValue = string | boolean | number | Record<string, string> | Array<any>

interface FieldSchema {
  id: string
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default: TValue
  validator?: TValidator
  msg?: string
}
```

#### props

`id`

`types.identifier`. The key of each field in a form, and will become the form type props key. It should be unique and will be used to access field value and in `setValue()` form action.

`value`

The props hold the field value. The value type can be `string`, `boolean`, `number`, `object`, `array`. `object` and `array` will be tranform to `types.frozen` as a MST leaf.

`default`

The default value of a field. The Mobx State Tree will decide `prop` type based on the type of this value.

`validator`

Optional & Private. All validators will be called in `valid()` before `submit()`.

`'required'` means this field cannot be falsy values, like `0`, `''`, or `undefined`.

`((...args: any[]) => boolean)` means a function return a boolean value. If returned `true`, the validation will be treated passed.

`RegExp` means the value will be used in `RegExp.test()`. If returned `true`, the validation will be treated passed.

`undefined | null` will not be processed.

`msg`

Optional. Message shows when field is invalid. The default message is `'The input is invalid'`

`invalid`

Compute value. Return revert value of `invalid()` result

#### actions

**`setValue(value)`**

Update field value.

**`valid()`**

Run field validator if it has.

**`reset()`**

Reset field value to default value.

> actions below will be less frequent to use.

`setValidator(rawValidator: TValidator)`

Change field validator after initialization

`init(field: IField)`

Rerun field initialization

`setErrorMsg(msg: string)`

Change invalid message

`clear()`

Set field value to `null`

#### code example

```typescript
form[id].value
form[id].invalid
form[id].setValue('new-value')
form[id].reset()
form[id].valid()
```

### Dynamic Field Group

#### schema

```typescript
interface DynamicFields {
  id: string
  limit: number
  schema: FieldSchema | FieldSchema[]
  default?: Array<Record<string, TValue>>
  onAdd?: (field) => any
  onRemove?: (field) => any
  onEdit?: (field) => void
}
```

#### props

`id`

`types.identifier`. The key of each dynamic field group in a form, and will become the form type props key. It should be unique and will be used to access field value and in `setDynamicValue()` form action.

`fields`

An array holds all dynamic field models. `schema` in the interface is to define field schema here. Object in `default` array will be used to create dynamic fields when form initializing.

`limit`

Optional. Maxium dynamic field allowed. default is `-1`, means unlimited.

#### actions

**`addFields(i, isInit = false)`**

Add new dynamic field `i`. You don't need to pass isInit flag when calling the action. It is used for not calling `onAdd` hooks in schema when initialization.

**`removeFields(id: string)`**

Remove the field with specific `id`. This action will call the `onRemove` hook if passed.

**`editField(id: string, fieldKey: string, value)`**

Edit `fieldKey` field with `id` to `value`. This action will call the `onEdit` hook if passed.

> actions below will be less frequent to use.

`getValues()`

Get all dynamic field values/

`valid()`

Valid all dynamic field.

`reset()`

Reset all dynamic fields.

#### code example

```typescript
form[id].fields.map(field => { ... })
form[id].addFields(field)
form[id].removeFields('id')
form[id].editField('id', 'key', 'value')
form[id].getValues() // get all dynamic field values, rarely used
form[id].valid() // valid all dynamic field, rarely used
form[id].reset() // reset all dynamic field, rarely used
```

### Form

#### schema

```typescript
interface FormSchema {
  static: FieldSchema[]
  dynamic?: DynamicFields[]
}
```

#### props

**fields**

Every field in `schema` will become a field `prop` of form type. The type of each field will be based on `default` value.

**`submission`**

A snapshot of last success submitted form values, in Key-Value object format.

`error`

An object in Key-Value format contains validation error of each field. This will be cleared on every `valid()` call.

`_internalStatus`

Indicate the form status, has 4 values: `'init', 'pending', 'success', 'error'`. Usually you don't need it, it will change according to form status.

`loading`

Compute value. Return `true` when form status is 'pending'. Designed for avoiding duplicated submission.

#### actions

**`setValue({ key, value })`**

Set **static** field value in a form type. `_internalStatus` is reserved.

**`setDynamicValue({ groupId, id, key, value })`**

Set **dynamic** field value in a form type. Each dynamic field has a field group id and a field id. Or you can use the `setValue` action on instance to do the same job.

**`submit()`**

It will return all field values if passed validation in Key-Value format object. The last valid submission will be hold in `submission` props.

**The method will not submit the form in any form of action. It only output the form current values. You need to handle to real submission action yourself.**

> actions below will be less frequent to use.

`init()`

It will be called after new custom type created with schema. It will process the schema to get default values and validators.

`valid()`

It will run all validators in schema with current field values. It will be called in `submit()`, and produce `error` if any error happens.

`reset()`

It will set the form type to `init` status, clearing submissions and errors. All fields will be set to default values passed by schema.

#### code example

```typescript
form.setValue({ key, value })
form.setDynamicValue({ groupId, id, key, value })
form.submit()
form.rest()
form.onAdd(id, field)
form.onRemove(groupId, fieldId)
form.onEdit(groupId, fieldId, key, value)
form.clear(groupId)
```
