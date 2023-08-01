import { WebsocketProvider } from 'y-websocket'
import { DocumentManager } from '../../js-pkg/sdk/src/main'
import { WebSocket } from 'ws'
import * as Y from 'yjs'
import { Server, ServerConfiguration } from './server'

const CONFIGURATIONS: ServerConfiguration[] = [
  { useAuth: false, server: 'native' },
  { useAuth: true, server: 'native' },
  { useAuth: false, server: 'worker' },
  { useAuth: true, server: 'worker' },
]

const FIVE_MINUTES_IN_MS = 10 * 60 * 1_000

describe.each(CONFIGURATIONS)(
  'Test $server (auth: $useAuth)',
  (configuration: ServerConfiguration) => {
    let SERVER: Server
    let DOCUMENT_MANANGER: DocumentManager

    beforeAll(async () => {
      SERVER = new Server(configuration)
      DOCUMENT_MANANGER = new DocumentManager({
        endpoint: SERVER.serverUrl(),
        token: SERVER.serverToken,
      })

      await SERVER.waitForReady()
    }, FIVE_MINUTES_IN_MS)

    afterAll(() => {
      SERVER.cleanup()
    })

    test('Create new doc', async () => {
      const result = await DOCUMENT_MANANGER.createDoc()
      expect(typeof result.doc_id).toBe('string')
    })

    test('Attempt to access non-existing doc', async () => {
      await expect(DOCUMENT_MANANGER.getConnectionKey('foobar', {})).rejects.toThrow('404')
    })

    test('Create and connect to doc', async () => {
      const docResult = await DOCUMENT_MANANGER.createDoc()
      const key = await DOCUMENT_MANANGER.getConnectionKey(docResult, {})

      if (configuration.useAuth) {
        expect(key.token).toBeDefined()
      } else {
        expect(key.token).toBeUndefined()
      }

      const doc = new Y.Doc()
      const params = key.token ? { token: key.token } : undefined
      const provider = new WebsocketProvider(key.base_url, key.doc_id, doc, {
        params,
        WebSocketPolyfill: require('ws'),
      })

      await new Promise((resolve, reject) => {
        provider.on('synced', resolve)
        provider.on('syncing', reject)
      })
    })

    test('Specify options as JSON', async () => {
      const config = JSON.stringify({
        endpoint: DOCUMENT_MANANGER.baseUrl,
        token: DOCUMENT_MANANGER.token,
      })

      expect(typeof config).toBe('string')
      const docManager = new DocumentManager(config)

      const docResult = await docManager.createDoc()
      expect(docResult.doc_id).toBeDefined()

      const key = await docManager.getConnectionKey(docResult, {})
      expect(key.base_url).toBeDefined()
    })

    if (configuration.useAuth) {
      test('Attempting to connect to a document without auth should fail', async () => {
        const docResult = await DOCUMENT_MANANGER.createDoc()
        const key = await DOCUMENT_MANANGER.getConnectionKey(docResult, {})

        expect(key.token).toBeDefined()
        delete key.token

        let ws = new WebSocket(`${key.base_url}/${key.doc_id}`)
        let result = new Promise<void>((resolve, reject) => {
          ws.addEventListener('open', () => {
            resolve()
          })
          ws.addEventListener('error', (e) => {
            reject(e.message)
          })
        })

        await expect(result).rejects.toContain('401')
      })
    }
  },
)
