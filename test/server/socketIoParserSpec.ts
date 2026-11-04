/*
 * Copyright (c) 2014-2022 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'
import { createServer } from 'http'
import { AddressInfo } from 'net'

for (const dependency of ['socket.io', 'socket.io-client']) {
  describe(`${dependency} packet parser`, () => {
    const { Decoder } = require(require.resolve('socket.io-parser', {
      paths: [require.resolve(dependency)]
    }))

    for (const num of ['splice', 'push', 'hasOwnProperty', undefined, null, -1, 10]) {
      it(`rejects a binary placeholder with index ${String(num)}`, () => {
        const decoder = new Decoder()
        decoder.add(`51-${JSON.stringify(['hello', { _placeholder: true, num }])}`)

        expect(() => decoder.add(Buffer.from('world'))).to.throw('illegal attachments')
        decoder.destroy()
      })
    }

    it('decodes an ordinary event', () => {
      const decoder = new Decoder()
      let data: any
      decoder.on('decoded', (packet: any) => { data = packet.data })

      decoder.add('2["hello","world"]')

      expect(data).to.deep.equal(['hello', 'world'])
      decoder.destroy()
    })

    it('decodes a valid binary placeholder as a Buffer', () => {
      const decoder = new Decoder()
      let data: any
      decoder.on('decoded', (packet: any) => { data = packet.data })

      decoder.add('51-["hello",{"_placeholder":true,"num":0}]')
      decoder.add(Buffer.from('world'))

      expect(data[0]).to.equal('hello')
      expect(Buffer.isBuffer(data[1])).to.equal(true)
      expect(data[1].toString()).to.equal('world')
      decoder.destroy()
    })
  })
}

describe('Socket.IO parser compatibility', () => {
  it('round-trips a binary event between the existing client and server', (done: Mocha.Done) => {
    const server = createServer()
    const io = require('socket.io')(server)
    let client: any

    const finish = (error?: Error) => {
      client.close()
      io.close(() => done(error))
    }

    io.on('connection', (socket: any) => {
      socket.on('hello', (data: Buffer) => socket.emit('hello', data))
    })

    server.listen(0, '127.0.0.1', () => {
      client = require('socket.io-client')(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, {
        reconnection: false,
        timeout: 1000
      })
      client.on('connect_error', finish)
      client.on('connect', () => client.emit('hello', Buffer.from('world')))
      client.on('hello', (data: Buffer) => {
        try {
          expect(Buffer.isBuffer(data)).to.equal(true)
          expect(data.toString()).to.equal('world')
          finish()
        } catch (error) {
          finish(error as Error)
        }
      })
    })
  })
})
