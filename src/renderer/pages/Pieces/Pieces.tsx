import {Button} from '@/components/ui/button'
import {EmptyState} from '@/components/ui/empty-state'
import {Box, Group, Stack} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {useCustomEventListener} from 'react-custom-events'
import {MdOutlineAddPhotoAlternate} from 'react-icons/md'
import PieceItem from './PieceItem/PieceItem'
import {sendAnalyticsEvent, AnalyticsEvent} from "@/utils";

function Loading() {
  return (
    <EmptyState title="Loading..."></EmptyState>
  )
}

function Pieces() {
  const [list, setList] = useState<any>([])
  const [loading, setLoading] = useState(true)

  function onReveal() {
    window.electron.reveal()
  }

  const getApiPieces = async () => {
    setLoading(true)
    const res = await fetch('http://localhost:3000/api/pieces')
    const json = await res.json()
    setList(json || [])
    setLoading(false)
    sendAnalyticsEvent(AnalyticsEvent.LoadedPieces, { pieces_size: json.length })
  }

  useCustomEventListener<any>('piece.created', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece.updated', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece.deleted', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece.changed', () => {
    getApiPieces()
  })

  useEffect(() => {
    getApiPieces()
  }, [])

  if (loading && list.length === 0) {
    return <Loading />
  }

  if (list?.length === 0) {
    return (
      <Box p="4">
        <EmptyState
          icon={<MdOutlineAddPhotoAlternate />}
          title="Directory is empty"
          description="Please add some images or meshes there"
        >
          <Group>
            <Button onClick={onReveal}>Open Directory</Button>
          </Group>
        </EmptyState>
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Stack gap="2">
        {list.map(item => (
          <PieceItem
            key={item.id}
            item={item}
          />
        ))}
      </Stack>
    </Box>
  )
}

export default Pieces
