import { types } from 'mobx-state-tree'
import { describe, expect, it } from 'vitest'
import createForm from '../src/index'

describe('Static Form', () => {
  const formSchema = {
    static: [
      { id: 'name', default: '', validator: 'required' },
      { id: 'age', default: '', validator: val => val >= 18 },
    ],
  }

  const formInstance = types
    .model()
    .props({
      form: createForm(formSchema),
    })
    .create({})

  it('should initialize correctly', () => {
    expect(formInstance.form._internalStatus).toEqual('init')
    expect(formInstance.form.submission).toEqual({})
    expect(formInstance.form.error).toEqual([])
  })

  it('should set and get values correctly', () => {
    formInstance.form.name.setValue('John Doe')
    expect(formInstance.form.name.value).toEqual('John Doe')
  })

  it('should validate fields correctly', () => {
    formInstance.form.age.setValue(20)
    expect(formInstance.form.age.valid()).toBeTruthy()

    formInstance.form.setValue({ key: 'age', value: 15 })
    expect(formInstance.form.age.valid()).toBeFalsy()
  })

  it('should submit form data', () => {
    formInstance.form.setValue({ key: 'age', value: 20 })

    formInstance.form.submit()
    expect(formInstance.form._internalStatus).toEqual('success')
  })

  it('should reset form state', () => {
    formInstance.form.setValue({ key: 'name', value: 'John Doe' })
    formInstance.form.reset()

    expect(formInstance.form._internalStatus).toEqual('init')
    expect(formInstance.form.submission).toEqual({})
    expect(formInstance.form.error).toEqual([])
    expect(formInstance.form.name.value).toEqual('')
  })
})

describe('Dynamic Form', () => {
  const formSchema = {
    static: [{ id: 'name', default: 'abc', validator: 'required' }],
    dynamic: [
      {
        id: 'group',
        schema: [{ id: 'field1', default: 0, validator: 'func' }],
        limit: 2,
      },
    ],
  }

  it('should create a form with given parameters', () => {
    const formInstance = types
      .model()
      .props({
        form: createForm(formSchema),
      })
      .create({})

    console.log(formInstance.form.group1)

    expect(formInstance.form.name.value).toEqual('abc')
    expect(formInstance.form.group.size).toEqual(0)
  })
})
