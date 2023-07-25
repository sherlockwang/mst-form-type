import { describe, expect, it } from 'vitest'
import createForm from '../src/index'

const formSchema = {
  name: {
    default: '',
    validator: 'required',
  },
  des: {
    default: '',
  },
  type: {
    default: 'cat',
    validator: type => type === 'cat' || type === 'dog',
  },
  weight: {
    default: 0,
    validator: /\d/i,
  },
}

describe('mst-form-type', () => {
  it('should initialize correctly', () => {
    const testForm = createForm(formSchema).create({})

    expect(testForm.internalStatus).toEqual('init')
    expect(testForm.submission).toEqual({})
    expect(testForm.error).toEqual([])
  })

  it('should set and get values correctly', () => {
    const testForm = createForm(formSchema).create({})
    const testData = {
      name: 'John Doe',
      weight: 30,
    }

    for (const key in testData) {
      testForm.setValue({ key, value: testData[key] })
    }

    expect(testForm.name).toEqual('John Doe')
    expect(testForm.weight).toEqual(30)
  })

  it('should validate fields correctly', () => {
    const testForm = createForm(formSchema).create({})

    testForm.valid()
    expect(testForm.internalStatus).toEqual('error')
    expect(testForm.error).toHaveLength(1)

    testForm.setValue({ key: 'name', value: 'John Doe' })
    testForm.setValue({ key: 'weight', value: 20 })
    testForm.valid()
    expect(testForm.internalStatus).toEqual('pending')
    expect(testForm.error).toHaveLength(0)

    testForm.setValue({ key: 'type', value: 'fish' })
    testForm.valid()
    expect(testForm.internalStatus).toEqual('error')
    expect(testForm.error).toHaveLength(1)
  })

  it('should submit form data', () => {
    const testForm = createForm(formSchema).create({})
    const testData = { name: 'John Doe', weight: 30, des: '', type: 'cat' }

    testForm.setValue({ key: 'name', value: 'John Doe' })
    testForm.setValue({ key: 'weight', value: 30 })

    const submission = testForm.submit()
    expect(testForm.internalStatus).toEqual('success')
    expect(testForm.submission).toEqual(testData)
    expect(submission).toEqual(testData)
  })

  it('should reset form state', () => {
    const testForm = createForm(formSchema).create({})

    testForm.reset()

    expect(testForm.internalStatus).toEqual('init')
    expect(testForm.submission).toEqual({})
    expect(testForm.error).toEqual([])
    expect(testForm.name).toEqual('')
    expect(testForm.weight).toEqual(0)
  })
})
