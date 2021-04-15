const AV = require('leancloud-storage')

class Context {
  /**
   * @param {object} data
   * @param {'create' | 'update'} updateType
   * @param {Array<string>} updatedKeys
   */
  constructor(data, updateType, updatedKeys) {
    this.updateType = updateType
    this._updatedKeys = new Set(updatedKeys)
    this._updatedKeysInCtx = new Set()
    this._ticketData = { ...data }
  }

  keyIsUpdated(key) {
    return this._updatedKeysInCtx.has(key) || this._updatedKeys.has(key)
  }

  getTicketStatus() {
    return this._ticketData.status
  }

  setTicketStatus(value) {
    this._ticketData.status = value
    this._updatedKeysInCtx.add('status')
  }

  getTicketAssigneeId() {
    return this._ticketData.assignee?.objectId
  }

  setTicketAssigneeId(value) {
    this._ticketData.assignee = {
      __type: 'Pointer',
      className: '_User',
      objectId: value,
    }
    this._updatedKeysInCtx.add('assignee')
  }

  /**
   * @returns {Promise<AV.Object | null>}
   */
  async commitUpdate() {
    if (this._updatedKeysInCtx.size === 0) {
      return null
    }

    const ticket = AV.Object.createWithoutData('Ticket', this._ticketData.objectId)
    for (const key of this._updatedKeysInCtx) {
      ticket.set(key, this._ticketData[key])
    }
    ticket.disableAfterHook()
    await ticket.save(null, { useMasterKey: true })

    const updatedTicket = AV.Object.createWithoutData('Ticket', this._ticketData.objectId)
    updatedTicket.updatedKeys = Array.from(this._updatedKeysInCtx)
    updatedTicket.updatedKeys.forEach((key) => {
      ticket.attributes[key] = this._ticketData[key]
    })
    return updatedTicket
  }
}

module.exports = { Context }
