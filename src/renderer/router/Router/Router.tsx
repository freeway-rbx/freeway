import {NavBar} from '@render/components'
import {useRoutePaths} from '@render/hooks'
import {Foobar, Login, Pieces, Register, Status, Users} from '@render/pages'
import {Route, Routes} from 'react-router-dom'
import {PrivateRoute} from '../PrivateRoute'
import {PublicRoute} from '../PublicRoute'

function Router() {
  const {
    LOGIN_PATH,
    STATUS_PATH,
    REGISTER_PATH,
    ROOT_PATH,
    PIECES_PATH,
    PIECE_PATH,
  } = useRoutePaths()

  return (
    <>
      <Routes>
        <Route
          path={ROOT_PATH}
          element={(
            <NavBar />
          )}
        />

        <Route
          path="/foobar"
          element={(
            <NavBar></NavBar>
          )}
        />

        <Route
          path={STATUS_PATH}
          element={(
            <NavBar />
          )}
        />
        <Route
          path={LOGIN_PATH}
          element={(
            <NavBar />
          )}
        />
      </Routes>

      <Routes>
        <Route
          path={ROOT_PATH}
          element={(
            <Pieces />
          )}
        />

        <Route
          path="/foobar"
          element={(
            <Foobar></Foobar>
          )}
        />

        <Route
          path={LOGIN_PATH}
          element={(
            <PublicRoute>
              <Login />
            </PublicRoute>
          )}
        />
        <Route path={REGISTER_PATH} element={<Register />} />

        <Route
          path={STATUS_PATH}
          element={(
            <Status />
          )}
        />

        <Route
          path={PIECES_PATH}
          element={(
            <PrivateRoute redirectTo={LOGIN_PATH}>
              <Pieces />
            </PrivateRoute>
          )}
        />

        <Route
          path={PIECE_PATH}
          element={(
            <PrivateRoute permissions={['users.list', 'users.create']}>
              <Users />
            </PrivateRoute>
          )}
        />

        <Route path="*" element={<h1>404 (oops)</h1>} />
      </Routes>
    </>

  )
}

export default Router
