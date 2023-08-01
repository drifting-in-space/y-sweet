import { ENV_CONFIG } from '@/lib/config'
import { TextEditor } from './TextEditor'
import { YDocProvider } from '../../../../js/src/react'
import { getOrCreateDoc } from '../../../../js/src/sdk'

type HomeProps = {
  searchParams: Record<string, string>
}

export default async function Home({ searchParams }: HomeProps) {
  const connectionKey = await getOrCreateDoc(searchParams.doc, ENV_CONFIG)

  return (
    <YDocProvider connectionKey={connectionKey} setQueryParam="doc">
      <TextEditor />
    </YDocProvider>
  )
}
