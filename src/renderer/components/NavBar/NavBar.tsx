import imgUrl from '@/assets/logo.png'
import {Avatar} from '@/components/ui/avatar'
import {ColorModeButton} from '@/components/ui/color-mode'
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import {Box, Button, Flex, HStack, IconButton, Image, Stack, useDisclosure} from '@chakra-ui/react'
import {useRoutePaths, useSession} from '@render/hooks'
import {useEffect} from 'react'
import {MdClose, MdMenu} from 'react-icons/md'
import {useLocation} from 'react-router-dom'
import NavBarLink from './NavBarLink'
import NavbarUpdateAvailable from './NavbarUpdateAvailable'

const isDev = window.electron.isDev

export default function NavBar() {
  const {isAuthenticated, user, signOut} = useSession()
  const {STATUS_PATH, ROOT_PATH} = useRoutePaths()
  const location = useLocation()
  const {open, onClose, onToggle} = useDisclosure()

  useEffect(() => {
    onClose()
  }, [location, onClose])

  function onClickRobloxAccount() {
    if (!user)
      return
    window.electron.openExternal(user.profile)
  }

  return (
    <Box bg={{base: 'gray.100', _dark: 'gray.800'}} px={4}>
      <Flex h={12} alignItems="center" justifyContent="space-between">
        <IconButton size="md" aria-label="Open Menu" display={{md: 'none'}} onClick={onToggle} variant="plain" p="0" ml="-3">
          {open ? <MdClose /> : <MdMenu />}
        </IconButton>
        <HStack gap={6} alignItems="center">
          <Box>
            <Image src={imgUrl} height="8"></Image>
          </Box>
          <HStack as="nav" gap={4} display={{base: 'none', md: 'flex'}}>
            <NavBarLink href={ROOT_PATH}>Pieces</NavBarLink>
            <NavBarLink href="/Foobar">Foobar</NavBarLink>
            {isDev && (<NavBarLink href={STATUS_PATH}>Status</NavBarLink>)}
          </HStack>
        </HStack>
        <Flex alignItems="center" gap="2">
          <NavbarUpdateAvailable></NavbarUpdateAvailable>
          <ColorModeButton></ColorModeButton>
          {isAuthenticated && (
            <MenuRoot>
              <MenuTrigger asChild>
                <Button variant="plain" p="0" outline="none">
                  <Avatar
                    size="sm"
                    src={user?.picture}
                  />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem value="account" onClick={onClickRobloxAccount}>Roblox Account →</MenuItem>
                <MenuItem value="settings">Settings</MenuItem>
                <MenuSeparator />
                <MenuItem value="signout" onClick={signOut} color="fg.error">Sign out</MenuItem>
              </MenuContent>
            </MenuRoot>
          )}
{/*
          {!isAuthenticated && (
            <NavBarLink href={LOGIN_PATH}>Login</NavBarLink>
          )}
*/}
        </Flex>
      </Flex>
      <>
        {open
          ? (
              <Box pb={4} display={{md: 'none'}}>
                <Stack as="nav" gap={2}>
                  <NavBarLink href={ROOT_PATH}>Pieces</NavBarLink>
                  <NavBarLink href="/Foobar">Foobar</NavBarLink>
                  <NavBarLink href={STATUS_PATH}>Status</NavBarLink>
                </Stack>
              </Box>
            )
          : null}
      </>
    </Box>
  )
}
