import {toaster} from '@/components/ui/toaster'
import StatusInfo from '@/pages/Status/StatusInfo'

import {Box, Button, Flex, Heading, Stack} from '@chakra-ui/react'
import {useState} from 'react'

function Status() {
  async function onClickBeep() {
    window.electronApi.ipcRenderer.send('app:beep')
  }

  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function onClickInstallStudioPlugin() {
    setIsLoading(true)
    const res = await fetch(`http://localhost:3000/api/plugins/install-studio-plugin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    setIsLoading(false)
    console.log('[Plugin] install result', json)

    toaster.create({
      title: `Plugin install result ${JSON.stringify(json)}`,
      type: 'success',
    })
  }

  return (
    <Box p={4}>
      <Heading size="2xl" mb={4}>Status</Heading>
      <StatusInfo></StatusInfo>
      <Flex gap={2}>
        <Stack>
          <Button
            variant="outline"
            onClick={onClickInstallStudioPlugin}
            loading={isLoading}
            loadingText="Loading..."
            w={200}
          >
            Install Studio Plugin
          </Button>
        </Stack>
        <Stack>
          <Button variant="outline" onClick={onClickBeep} w={200}>Beep (Test IPC)</Button>
        </Stack>
      </Flex>
    </Box>
  )
}

export default Status
