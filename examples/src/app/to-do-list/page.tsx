import { ENV_CONFIG } from '@/lib/config'
import { ToDoList } from './ToDoList'
import { YDocProvider } from '@y-sweet/react'
import { getOrCreateDoc } from '@y-sweet/sdk'

type HomeProps = {
  searchParams: Record<string, string>
}

export default async function Home({ searchParams }: HomeProps) {
  const clientToken = await getOrCreateDoc(searchParams.doc, ENV_CONFIG)

  return (
    <YDocProvider clientToken={clientToken} setQueryParam="doc">
      <ToDoList />
    </YDocProvider>
  )
}
