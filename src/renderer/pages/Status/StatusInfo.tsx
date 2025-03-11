import {useSession} from '@/hooks'
import {Box, Heading, Link, Stack, Text} from '@chakra-ui/react'

export default function StatusInfo() {
  const {testData} = useSession()

  function onClickReveal(dir: string) {
    return () => {
      window.electron.reveal(dir, true)
    }
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
            <Link onClick={onClickReveal(testData.watchDirectory)}>{testData.watchDirectory}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData.logsDirectory)}>{testData.logsDirectory}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData.studioPluginsDir)}>{testData.studioPluginsDir}</Link>
          </Text>
          <Text>
            <Link onClick={onClickReveal(testData.studioLinksDir)}>{testData.studioLinksDir}</Link>
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
