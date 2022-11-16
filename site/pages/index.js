import { useEffect } from "react"
import { backendFetchGET } from "../utils/backendFetch"

export default function Home() {

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