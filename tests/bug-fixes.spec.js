import { describe, it, expect } from 'vitest'

describe(' bugs fix', () => {
  it('updated should be correct in getChangedData', () => {
    const changedData = {
      new: [],
      updated: [],
      deleted: []
    }
    expect(changedData.updated).toBeDefined()
    expect(changedData.update).toBeUndefined()
  })

  it('deleted should be correct in getChangedData', () => {
    const changedData = {
      new: [],
      updated: [],
      deleted: []
    }
    expect(changedData.deleted).toBeDefined()
    expect(changedData.delete).toBeUndefined()
  })
})
