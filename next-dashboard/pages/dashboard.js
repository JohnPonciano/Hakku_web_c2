import InfoGrid from '../src/components/InfoGrid/infogrid'
import { getCookie } from 'cookies-next'
import { verifica } from "../services/jwt"

export default function Dashboard() {
  return (
    <div >
      <InfoGrid/>
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