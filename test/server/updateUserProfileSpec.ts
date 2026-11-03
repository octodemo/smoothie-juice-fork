/*
 * Copyright (c) 2014-2022 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

const isHtmleditUrl = require('../../routes/updateUserProfile').isHtmleditUrl
const expect = require('chai').expect

describe('updateUserProfile', () => {
  it('should recognize the htmledit.squarefree.com host', () => {
    expect(isHtmleditUrl('http://htmledit.squarefree.com')).to.equal(true)
    expect(isHtmleditUrl('https://htmledit.squarefree.com/editor')).to.equal(true)
  })

  it('should reject URLs that only contain the host in another component', () => {
    expect(isHtmleditUrl('http://evil.example/://htmledit.squarefree.com')).to.equal(false)
    expect(isHtmleditUrl('http://htmledit.squarefree.com.evil.example')).to.equal(false)
    expect(isHtmleditUrl('not a URL')).to.equal(false)
  })
})

export {}
