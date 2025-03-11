import {Box, Heading, Link, Stack, Text} from '@chakra-ui/react'
import {useEffect, useState} from 'react'

interface TestData {
  date: string
  nodeVersion: string // Node.js version string
  appVersion: string // Application version string
  resourceDir: string // Directory path as a string
  studioLinksDir: string // Directory path as a string
  studioPluginsDir: string // Directory path as a string
  watchDirectory: string // Directory path as a string
  logsDirectory: string // Directory path as a string
}

export default function StatusInfo() {
  const [testData, setTestData] = useState<TestData | null>(null)

  async function getApiTest() {
    const res = await fetch(`http://localhost:3000/api/test`)
    const json = await res.json()
    setTestData(json)
  }

  function onClickReveal(dir: string) {
    return () => {
      window.electron.reveal(dir, true)
    }
  }

  useEffect(() => {
    getApiTest()
  }, [])

  if (!testData) {
    return null
  }

  return (
    <Box my={4}>
      <Stack gap={4}>
        <Box>
          <strong>Application version:</strong>
          {' '}
          {testData.appVersion}
        </Box>
        <Box>
          <Heading size="md">Directories</Heading>
          <Text>
            <Link onClick={onClickReveal(testData?.watchDirectory)}>{testData?.watchDirectory}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData?.logsDirectory)}>{testData?.logsDirectory}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData?.studioPluginsDir)}>{testData?.studioPluginsDir}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData?.studioLinksDir)}>{testData?.studioLinksDir}</Link>
          </Text>
{/*
          <pre>
            {JSON.stringify(testData || null, null, 2)}
          </pre>
*/}
        </Box>
      </Stack>
    </Box>
  )
}
