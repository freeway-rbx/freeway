import {GetApiTestDto} from '@/api'
// import { AxiosError } from 'axios'
import {createContext} from 'react'

export interface User {
  name: string
  nickname: string
  preferredUsername: string
  profile: string
  picture: string

  permissions?: string[] // not in use
  roles?: string[] // not in use
}

export interface AuthContextData {
  testData: GetApiTestDto
  user?: User
  isAuthenticated: boolean
  loadingUserData: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext({} as AuthContextData)

export default AuthContext
