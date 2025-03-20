import {EmptyState} from '@/components/ui/empty-state'
import {Box, Stack} from '@chakra-ui/react'
import {useEffect, useState} from 'react'

function Loading() {
  return (
    <EmptyState title="Loading..."></EmptyState>
  )
}

function Foobar() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const getApiFoobar = async () => {
    setLoading(true)
    const res = await fetch('http://localhost:3000/api/foobar')
    const json = await res.json()
    setData(json || [])
    setLoading(false)
  }

  useEffect(() => {
    getApiFoobar()
  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <Box p={4}>
      My foobar data
      <Stack gap="2">
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Stack>
    </Box>
  )
}

export default Foobar
