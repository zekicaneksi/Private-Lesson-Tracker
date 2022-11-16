import { useEffect } from "react"
import { useRouter } from "next/router"
import { backendFetchGET } from "../utils/backendFetch"

export default function Home() {
  const router = useRouter()

  useEffect(() => {

    backendFetchGET('/getUserInfo', async (response) => {
      if (response.status == 200) {
        let userInfo = await response.json();
        window.location.replace('/' + userInfo.user_type);
      }
      else {
        window.location.replace('/signin');
      }
    });

  }, [])

  return null
}