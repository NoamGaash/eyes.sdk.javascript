import {makeDriver, type SpecType, type Driver} from '@applitools/driver'
import {MockDriver, spec} from '@applitools/driver/fake'
import {makeLogger} from '@applitools/logger'
import {RawDomSnapshot, takeDomSnapshot} from '../../../src/ufg/utils/take-dom-snapshot'
import assert from 'assert'

const logger = makeLogger()

function generateSnapshotResponse(overrides: Partial<RawDomSnapshot>) {
  return JSON.stringify({status: 'SUCCESS', value: generateSnapshotObject(overrides)})
}

function generateSnapshotObject(overrides: Partial<RawDomSnapshot>): RawDomSnapshot {
  return {
    url: 'url',
    selector: 'selector',
    cdt: [],
    srcAttr: null,
    resourceUrls: [],
    blobs: [],
    frames: [],
    crossFrames: undefined,
    scriptVersion: 'mock value',
    ...overrides,
  }
}

describe('take-dom-snapshot', () => {
  let mock: MockDriver, driver: Driver<SpecType<MockDriver>>

  beforeEach(async () => {
    mock = new MockDriver()
    driver = await makeDriver({logger, spec, driver: mock})
  })

  it('should throw an error if snapshot failed', async () => {
    mock.mockScript('dom-snapshot', function () {
      return JSON.stringify({status: 'ERROR', error: 'some error'})
    })
    await assert.rejects(
      takeDomSnapshot({context: driver.currentContext, logger}),
      error => error.message === "Error during execute poll script: 'some error'",
    )
  })

  it('should throw an error if timeout is reached', async () => {
    mock.mockScript('dom-snapshot', function () {
      return JSON.stringify({status: 'WIP'})
    })
    await assert.rejects(
      takeDomSnapshot({context: driver.currentContext, settings: {executionTimeout: 0}, logger}),
      error => error.message === 'Poll script execution is timed out',
    )
  })

  it('should take a dom snapshot', async () => {
    mock.mockScript('dom-snapshot', function () {
      return generateSnapshotResponse({
        cdt: [{attributes: [{name: 'cdt', value: 'cdt'}]}],
        resourceUrls: ['resourceUrls'],
        blobs: [{url: 'blob-1', value: 'abc'}],
        frames: [],
      })
    })
    const actualSnapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(actualSnapshot, {
      url: 'url',
      cdt: [{attributes: [{name: 'cdt', value: 'cdt'}]}],
      frames: [],
      resourceContents: {
        'blob-1': {url: 'blob-1', value: 'abc'},
      },
      resourceUrls: ['resourceUrls'],
      srcAttr: null,
      scriptVersion: 'mock value',
      cookies: [],
    })
  })

  it('should take a dom snapshot with cross origin frames', async () => {
    mock.mockElements([{selector: '[data-applitools-selector="123"]', frame: true}])
    mock.mockScript('dom-snapshot', function (this: any) {
      return this.name === '[data-applitools-selector="123"]'
        ? generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'frame-cdt'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
          })
        : generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cross-origin-iframe', value: 'true'}]}],
            crossFrames: [{selector: '[data-applitools-selector="123"]', index: 0}],
          })
    })
    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(snapshot, {
      cdt: [
        {
          attributes: [
            {name: 'cross-origin-iframe', value: 'true'},
            {name: 'data-applitools-src', value: 'http://cors.com/?applitools-iframe=known'},
          ],
        },
      ],
      resourceContents: {},
      resourceUrls: [],
      scriptVersion: 'mock value',
      srcAttr: null,
      url: 'url',
      frames: [
        {
          cdt: [{attributes: [{name: 'cdt', value: 'frame-cdt'}]}],
          frames: [],
          url: 'http://cors.com/?applitools-iframe=known',
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
        },
      ],
      cookies: [],
    })
  })

  it('should take a dom snapshot with cross origin frames with the same src attr', async () => {
    mock.mockElements([
      {
        selector: '[data-applitools-selector="123"]',
        frame: true,
      },
      {
        selector: '[data-applitools-selector="456"]',
        frame: true,
      },
    ])
    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case '[data-applitools-selector="123"]':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'frame-cdt'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
          })
        case '[data-applitools-selector="456"]':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'another-frame-cdt'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
          })
        default:
          return generateSnapshotResponse({
            cdt: [
              {attributes: [{name: 'cross-origin-frame-1', value: 'true'}]},
              {attributes: [{name: 'cross-origin-frame-2', value: 'true'}]},
            ],
            crossFrames: [
              {selector: '[data-applitools-selector="123"]', index: 0},
              {selector: '[data-applitools-selector="456"]', index: 1},
            ],
          })
      }
    })

    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(snapshot, {
      cdt: [
        {
          attributes: [
            {name: 'cross-origin-frame-1', value: 'true'},
            {
              name: 'data-applitools-src',
              value: 'http://cors.com/?applitools-iframe=known',
            },
          ],
        },
        {
          attributes: [
            {name: 'cross-origin-frame-2', value: 'true'},
            {
              name: 'data-applitools-src',
              value: 'http://cors.com/?applitools-iframe=known',
            },
          ],
        },
      ],
      resourceContents: {},
      resourceUrls: [],
      scriptVersion: 'mock value',
      srcAttr: null,
      url: 'url',
      frames: [
        {
          cdt: [{attributes: [{name: 'cdt', value: 'frame-cdt'}]}],
          frames: [],
          url: 'http://cors.com/?applitools-iframe=known',
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
        },
        {
          cdt: [{attributes: [{name: 'cdt', value: 'another-frame-cdt'}]}],
          frames: [],
          url: 'http://cors.com/?applitools-iframe=known',
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
        },
      ],
      cookies: [],
    })
  })

  it('should take a dom snapshot with nested cross origin frames', async () => {
    mock.mockElements([
      {
        selector: '[data-applitools-selector="123"]',
        frame: true,
        children: [
          {
            selector: '[data-applitools-selector="456"]',
            frame: true,
          },
        ],
      },
    ])

    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case '[data-applitools-selector="123"]':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'nested-cross-origin-frame', value: 'true'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
            crossFrames: [{selector: '[data-applitools-selector="456"]', index: 0}],
          })
        case '[data-applitools-selector="456"]':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'nested-frame'}]}],
            url: 'http://cors-2.com/?applitools-iframe=known',
          })
        default:
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cross-origin-frame', value: 'true'}]}],
            crossFrames: [{selector: '[data-applitools-selector="123"]', index: 0}],
          })
      }
    })

    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})

    assert.deepStrictEqual(snapshot, {
      cdt: [
        {
          attributes: [
            {name: 'cross-origin-frame', value: 'true'},
            {
              name: 'data-applitools-src',
              value: 'http://cors.com/?applitools-iframe=known',
            },
          ],
        },
      ],
      frames: [
        {
          cdt: [
            {
              attributes: [
                {name: 'nested-cross-origin-frame', value: 'true'},
                {
                  name: 'data-applitools-src',
                  value: 'http://cors-2.com/?applitools-iframe=known',
                },
              ],
            },
          ],
          frames: [
            {
              cdt: [{attributes: [{name: 'cdt', value: 'nested-frame'}]}],
              frames: [],
              url: 'http://cors-2.com/?applitools-iframe=known',
              resourceContents: {},
              resourceUrls: [],
              scriptVersion: 'mock value',
              srcAttr: null,
            },
          ],
          url: 'http://cors.com/?applitools-iframe=known',
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
        },
      ],
      resourceContents: {},
      resourceUrls: [],
      scriptVersion: 'mock value',
      srcAttr: null,
      url: 'url',
      cookies: [],
    })
  })

  it('should take a dom snapshot with nested frames containing cross origin frames', async () => {
    mock.mockElements([
      {
        selector: '[data-applitools-selector="123"]',
        frame: true,
        children: [
          {
            selector: '[data-applitools-selector="456"]',
            frame: true,
          },
        ],
      },
    ])

    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case '[data-applitools-selector="456"]':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'nested-frame'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
            selector: '[data-applitools-selector="456"]',
          })
        default:
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'top-page'}]}],
            frames: [
              generateSnapshotObject({
                cdt: [{attributes: [{name: 'cross-origin-frame', value: 'true'}]}],
                url: 'http://same-origin',
                selector: '[data-applitools-selector="123"]',
                crossFrames: [{selector: '[data-applitools-selector="456"]', index: 0}],
              }),
            ],
          })
      }
    })

    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})

    assert.deepStrictEqual(snapshot, {
      cdt: [{attributes: [{name: 'cdt', value: 'top-page'}]}],
      frames: [
        {
          cdt: [
            {
              attributes: [
                {name: 'cross-origin-frame', value: 'true'},
                {
                  name: 'data-applitools-src',
                  value: 'http://cors.com/?applitools-iframe=known',
                },
              ],
            },
          ],
          frames: [
            {
              cdt: [{attributes: [{name: 'cdt', value: 'nested-frame'}]}],
              url: 'http://cors.com/?applitools-iframe=known',
              frames: [],
              resourceContents: {},
              resourceUrls: [],
              scriptVersion: 'mock value',
              srcAttr: null,
            },
          ],
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
          url: 'http://same-origin',
        },
      ],
      url: 'url',
      resourceContents: {},
      resourceUrls: [],
      scriptVersion: 'mock value',
      srcAttr: null,
      cookies: [],
    })
  })

  it('should handle failure to switch to frame', async () => {
    mock.mockElements([
      {
        selector: '[data-applitools-selector="123"]',
      },
    ])
    mock.mockScript('dom-snapshot', function () {
      return generateSnapshotResponse({
        cdt: [
          {
            attributes: [
              {
                name: 'src',
                value: './topframe.html',
              },
            ],
          },
        ],
        crossFrames: [{selector: '[data-applitools-selector="123"]', index: 0}],
      })
    })

    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(snapshot.frames, [])
  })

  it('should handle failure to switch to nested frame', async () => {
    const url = 'https://some_url.com/?applitools-iframe=known'
    mock.mockElements([
      {
        selector: '[data-applitools-selector="123"]',
        frame: true,
        isCORS: true,
        children: [
          {
            selector: '[data-applitools-selector="456"]',
          },
        ],
      },
    ])
    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case '[data-applitools-selector="123"]':
          return generateSnapshotResponse({
            cdt: [
              {
                attributes: [
                  {
                    name: 'src',
                    value: './innerparentframe.html',
                  },
                ],
              },
            ],
            url,
            crossFrames: [{selector: '[data-applitools-selector="456"]', index: 0}],
          })
        default:
          return generateSnapshotResponse({
            cdt: [{attributes: []}],
            crossFrames: [{selector: '[data-applitools-selector="123"]', index: 0}],
          })
      }
    })

    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(snapshot.frames, [
      {
        cdt: [
          {
            attributes: [
              {
                name: 'src',
                value: '',
              },
            ],
          },
        ],
        resourceContents: {},
        resourceUrls: [],
        frames: [],
        scriptVersion: 'mock value',
        srcAttr: null,
        url: 'https://some_url.com/?applitools-iframe=known',
      },
    ])
  })

  it('should add data-applitools-src to the cors frame cdt node', async () => {
    mock.mockElements([
      {
        name: 'cors-frame',
        selector: '[data-applitools-selector="1"]',
        frame: true,
        isCORS: true,
      },
    ])
    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case 'cors-frame':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'cors frame'}]}],
            url: 'http://cors.com/?applitools-iframe=known',
          })
        default:
          return generateSnapshotResponse({
            cdt: [{attributes: []}],
            crossFrames: [{selector: '[data-applitools-selector="1"]', index: 0}],
          })
      }
    })
    const {cdt} = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(cdt, [
      {
        attributes: [{name: 'data-applitools-src', value: 'http://cors.com/?applitools-iframe=known'}],
      },
    ])
  })

  it('should modify data urls on iframes', async () => {
    // the following is a mock of an element like this: <iframe src="data:text/html,<div>hi there</div>"></iframe>
    mock.mockElements([
      {
        name: 'some-frame-with-data-url',
        selector: '[data-applitools-selector="1"]',
        frame: true,
        isCORS: true,
      },
    ])
    mock.mockScript('dom-snapshot', function (this: any) {
      switch (this.name) {
        case 'some-frame-with-data-url':
          return generateSnapshotResponse({
            cdt: [{attributes: [{name: 'cdt', value: 'some frame with data url'}]}],
            url: 'data:text/html,bla bla bla?applitools-iframe=known',
          })
        default:
          return generateSnapshotResponse({
            cdt: [{attributes: []}],
            crossFrames: [{selector: '[data-applitools-selector="1"]', index: 0}],
          })
      }
    })
    const snapshot = await takeDomSnapshot({context: driver.currentContext, logger})
    assert.deepStrictEqual(snapshot, {
      cdt: [
        {
          attributes: [{name: 'data-applitools-src', value: 'http://data-url-frame/?applitools-iframe=known'}],
        },
      ],
      resourceContents: {},
      resourceUrls: [],
      scriptVersion: 'mock value',
      srcAttr: null,
      url: 'url',
      frames: [
        {
          cdt: [{attributes: [{name: 'cdt', value: 'some frame with data url'}]}],
          resourceContents: {},
          resourceUrls: [],
          scriptVersion: 'mock value',
          srcAttr: null,
          url: 'http://data-url-frame/?applitools-iframe=known',
          frames: [],
        },
      ],
      cookies: [],
    })
  })
})
