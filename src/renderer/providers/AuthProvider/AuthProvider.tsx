import {EmptyState} from '@/components/ui/empty-state'
import {Box} from '@chakra-ui/react'
import {getApiTest, GetApiTestDto} from '@render/api'
import {AuthContext, User} from '@render/contexts'
import {paths} from '@render/router'
import {ReactNode, useEffect, useState} from 'react'
import {useCustomEventListener} from 'react-custom-events'
import {useNavigate} from 'react-router-dom'
// import { api, setAuthorizationHeader } from '@render/services'
// import { createSessionCookies, getToken, removeSessionCookies } from '@render/utils'

interface Props {
  children: ReactNode
}

function AuthProvider(props: Props) {
  const {children} = props

  const [user, setUser] = useState<User>()
  const [loadingUserData, setLoadingUserData] = useState(false)
  const navigate = useNavigate()
  // const { pathname } = useLocation()

  // const token = getToken()
  // const isAuthenticated = Boolean(token)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  async function signIn() {
    console.log('[AuthProvider] signIn')
    window.electron.login()
  }

  async function signOut() {
    // removeSessionCookies()
    setUser(undefined)
    setLoadingUserData(false)
    setIsAuthenticated(false)
    navigate(paths.LOGIN_PATH)
    window.electron.logout()
  }

  const [testData, setTestData] = useState<GetApiTestDto>()
  const [testAttempt, setTestAttempt] = useState<number>(1)

  async function fetchTestData() {
    let data: GetApiTestDto | null = null
    do {
      try {
        data = await getApiTest()
        setTestData(data)
      }
      catch (err: any) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setTestAttempt(testAttempt + 1)
        console.error(err)
      }
    } while (!data)
  }

  useEffect(() => {
    fetchTestData()
  }, [])

  /*
  useEffect(() => {
    console.log('use effect');
    if (!token) {
      removeSessionCookies()
      setUser(undefined)
      setLoadingUserData(false)
    }
  }, [navigate, pathname, token])
*/

  // async function getUserData() {
  //   if (loadingUserData) {
  //     // return
  //   }
  //
  //   setLoadingUserData(true)
  //
  //   try {
  //     const account = await window.electron.getAccount() as User
  //     if (account) {
  //       setUser(account)
  //       console.log('[AuthProvider] getUserData()', account)
  //       setIsAuthenticated(true)
  //     }
  //     else {
  //       console.log('[AuthProvider] getUserData()', null)
  //       setIsAuthenticated(false)
  //     }
  //   }
  //   catch (error) {
  //     console.error(error)
  //     setIsAuthenticated(false)
  //   }
  //   finally {
  //     setLoadingUserData(false)
  //   }
  // }

  // useCustomEventListener<any>('ready', async () => {
  //   console.log('[AuthProvider] ready getUserData')
  //   // await getUserData()
  // })

  useCustomEventListener<any>('app:online', async () => {
    console.log('[app:online]')
  })

  useCustomEventListener<any>('app:offline', async () => {
    console.log('[app:offline]')
  })

  // useEffect(() => {
  //   console.log('[AuthProvider] effect getUserData')
  //   getUserData()
  // }, [])

  if (!testData) {
    return (
      <>
        <EmptyState title="Loading..." mt="12">
          {testAttempt > 2 && <Box>Attempt {testAttempt}</Box>}
        </EmptyState>
      </>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loadingUserData,
        testData,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
