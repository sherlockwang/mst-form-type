import { describe, expect, it, vitest } from 'vitest'
import form from '../src/index'

describe('mst-request', () => {
  it('should init correctly', () => {
    const testRequest = form.create()

    expect(testRequest.status).toEqual('init')
  })

  it('should set a request function', () => {
    const testRequest = form.create()
    const mockRequestFunc = vitest.fn()

    testRequest.set(mockRequestFunc)

    expect(testRequest.fetch).toBeDefined()
  })

  it('should fetch data successfully', async () => {
    const testRequest = form.create()
    const mockData = [{ id: 1, name: 'Test' }]
    const mockRequestFunc = vitest.fn().mockResolvedValue(mockData)

    testRequest.set(mockRequestFunc)
    await testRequest.fetch()

    expect(testRequest.status).toEqual('success')
    expect(testRequest.data).toEqual(mockData)
  })

  it('should handle request errors', async () => {
    const testRequest = form.create()
    const mockError = new Error('Request failed')
    const mockRequestFunc = vitest.fn().mockRejectedValue(mockError)
    const mockErrorHandler = vitest.fn()

    testRequest.set(mockRequestFunc, mockErrorHandler)
    await testRequest.fetch()

    expect(testRequest.status).toEqual('error')
    expect(testRequest.error).toEqual(mockError)
    expect(testRequest.data).toEqual([])
    expect(mockErrorHandler).toHaveBeenCalledWith(mockError)
  })

  it('should cancel the request', async () => {
    const testRequest = form.create()
    const mockRequestFunc = vitest
      .fn()
      .mockImplementation(() => Promise.resolve())

    testRequest.set(mockRequestFunc)
    testRequest.setCancel(new AbortController())
    testRequest.fetch()
    testRequest.cancel()

    expect(testRequest.status).toEqual('canceled')
  })

  it('should refetch data', async () => {
    const testRequest = form.create()
    const mockData = [{ id: 1, name: 'Test' }]
    const mockRequestFunc = vitest.fn().mockResolvedValue(mockData)

    testRequest.set(mockRequestFunc)
    await testRequest.refetch()

    expect(testRequest.status).toEqual('success')
    expect(testRequest.data).toEqual(mockData)
  })

  it('should reset the model', () => {
    const testRequest = form.create({
      status: 'success',
      data: [{ id: 1, name: 'Test' }],
    })

    testRequest.reset()

    expect(testRequest.status).toEqual('init')
    expect(testRequest.data).toEqual([])
  })
})
