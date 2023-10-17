import { describe, expect, it } from 'vitest'
import createForm from '../src/index'

const formSchema = { static: [{ id: 'name', default: '', validator: 'required' }] }

describe('baseForm', () => {
  it('should initialize correctly', () => {
    const testForm = createForm(formSchema)

    expect(testForm._internalStatus).toEqual('init')
    expect(testForm.submission).toEqual({})
    expect(testForm.error).toEqual([])
  })

  it('should set and get values correctly', () => {
    const testForm = createForm(formSchema)

    testForm.setValue({ key: 'name', value: 'John Doe' })
    expect(testForm.name.value).toEqual('John Doe')
  })

  it('should validate fields correctly', () => {
    const testForm = createForm(formSchema)

    testForm.setValue({ key: 'age', value: 20 })
    expect(testForm.age.valid()).toBeTruthy()

    testForm.setValue({ key: 'age', value: 15 })
    expect(testForm.age.valid()).toBeFalsy()
  })

  it('should submit form data', () => {
    const testForm = createForm(formSchema)

    testForm.submit()
    expect(testForm._internalStatus).toEqual('success')
  })

  it('should reset form state', () => {
    const testForm = createForm(formSchema)

    testForm.setValue({ key: 'name', value: 'John Doe' })
    testForm.reset()

    expect(testForm._internalStatus).toEqual('init')
    expect(testForm.submission).toEqual({})
    expect(testForm.error).toEqual([])
    expect(testForm.name.value).toEqual('')
  })
})

describe('createForm', () => {
  it('should create a form with given parameters', () => {
    const params = {
      static: [{ id: 'name', default: '', validator: 'required' }],
      dynamic: [
        {
          id: 'group1',
          schema: [{ id: 'field1', default: 0, validator: 'func' }],
          limit: 2,
        },
      ],
    }

    const testForm = createForm(params)

    expect(testForm.name.value).toEqual('')
    expect(testForm.group1.size).toEqual(0)
  })
})
