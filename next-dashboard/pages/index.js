import { getCookie } from 'cookies-next'
import {verifica} from '../services/jwt'
import Dashboard from '../pages/dashboard'

export default function Home() {
  return (
    <div>
      <Dashboard/>
    </div>
  )
}

export const getServerSideProps = async ({ req, res }) => {
  try {
    const token = getCookie('authorization', { req, res })
    if (!token) throw new Error('invalid token')

    verifica(token)
    return { props: {} }

  } catch (err) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
      props: {},
    }
  }
}