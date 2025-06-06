import {useSession} from '@render/hooks'
import {validateUserPermissions} from '@render/utils'
import {ReactNode} from 'react'

interface Props {
  children: ReactNode
  permissions?: string[]
  roles?: string[]
}

function CanAccess(props: Props) {
  const {children, permissions, roles} = props

  const {isAuthenticated, user} = useSession()
  const {hasAllPermissions, hasAllRoles} = validateUserPermissions({
    user,
    permissions,
    roles,
  })

  if (!isAuthenticated || !hasAllPermissions || !hasAllRoles) {
    return null
  }

  return <>{children}</>
}

export default CanAccess
