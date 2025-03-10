'use client'

import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {Button, Flex, Link, Text} from '@chakra-ui/react'

import {useEffect, useState} from 'react'
import {useCustomEventListener} from 'react-custom-events'

export default function NavbarUpdateAvailable() {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useCustomEventListener<any>('app-updater:update-available', async (data) => {
    setIsUpdateAvailable(true)
    setUpdateInfo(data)
  })

  const getApiAppUpdateAvailable = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/app/update-info')
      const json = await res.json()

      if (json && json.isUpdateAvailable) {
        setUpdateInfo(json.updateInfo)
        setIsUpdateAvailable(true)
      }
    }
    catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    getApiAppUpdateAvailable()
  }, [])

  useEffect(() => {
    setDialogOpen(true)
    console.log('setDialogOpen(true)')
  }, [updateInfo])

  const onOpenChange = (e) => {
    setDialogOpen(e.open)
    console.log(e.open)
  }

  const onUpdate = (_ev) => {
    window.electron.appUpdate()
  }

  if (!isUpdateAvailable) {
    return null
  }

  const uriReleases = `https://github.com/freeway-rbx/freeway/releases`
  const uriRelease = `${uriReleases}/tag/${updateInfo.tag}`

  return (
    <>
      <PopoverRoot open={popoverOpen} onOpenChange={e => setPopoverOpen(e.open)} autoFocus={false}>
        <PopoverTrigger asChild>
          <Button size="xs" colorPalette="teal">
            Update available
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverBody>
            <PopoverTitle fontWeight="medium">Update available</PopoverTitle>
            <Text mt={2}>
              <span>A new </span>
              <Link variant="underline" href={uriRelease} target="_blank">version {updateInfo.version}</Link>
              <span> is available.</span>
              <br />
              <span>For more information see </span>
              <Link variant="underline" href={uriReleases} target="_blank">release page</Link>
              .
            </Text>
            <Flex justify="right" mt={4}>
              <Text text-align="right">
                <Button onClick={onUpdate} size="xs" colorPalette="teal">
                  Update
                </Button>
              </Text>
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </PopoverRoot>

      <DialogRoot open={dialogOpen} onOpenChange={onOpenChange} placement="center">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update available</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p>
              <span>A new </span>
              <Link variant="underline" href={uriRelease} target="_blank">version {updateInfo.version}</Link>
              <span> is available.</span>
              <br />
              <span>Please </span>
              <Link variant="underline" href={uriReleases} target="_blank">download</Link>
              <span> and install the {updateInfo.version} version.</span>
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Close</Button>
            </DialogActionTrigger>
            <Button onClick={onUpdate}>
              Update
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </>
  )
}
