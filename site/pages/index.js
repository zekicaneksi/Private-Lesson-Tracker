import { useEffect } from "react"
import { backendFetchGET } from "../utils/backendFetch";
import { useRouter } from "next/router";

export default function Home() {

  const router = useRouter()

  useEffect(() => {

    backendFetchGET('/getUserInfo', async (response) => {
      if (response.status == 200) {
        let userInfo = await response.json();
        router.replace('/' + userInfo.user_type);
      }
      else {
        router.replace('/signin');
      }
    });

  }, [])

  return null
}