/*
 * Copyright (c) 2014-2022 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai = require('chai')
import path = require('path')
const expect = chai.expect

for (const dependency of ['socket.io', 'socket.io-client']) {
  describe(`${dependency} packet decoder`, () => {
    const { Decoder } = require(require.resolve('socket.io-parser', {
      paths: [path.dirname(require.resolve(dependency))]
    }))

    for (const num of ['splice', 'push', 'hasOwnProperty', 10, -1, null, undefined]) {
      it(`rejects binary placeholder index ${String(num)}`, () => {
        const decoder = new Decoder()
        let decoded = false
        decoder.on('decoded', () => { decoded = true })
        decoder.add(`51-${JSON.stringify(['hello', { _placeholder: true, num }])}`)

        expect(() => decoder.add(Buffer.from('world'))).to.throw('illegal attachments')
        expect(decoded).to.equal(false)
        decoder.destroy()
      })
    }

    it('decodes a valid binary attachment', () => {
      const decoder = new Decoder()
      const attachment = Buffer.from('world')
      let data: any
      decoder.on('decoded', (packet: any) => { data = packet.data })

      decoder.add('51-["hello",{"_placeholder":true,"num":0}]')
      decoder.add(attachment)

      expect(data).to.deep.equal(['hello', attachment])
      expect(Buffer.isBuffer(data[1])).to.equal(true)
      decoder.destroy()
    })
  })
}
