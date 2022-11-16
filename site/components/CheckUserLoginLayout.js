import { useEffect, useState } from "react"
import { backendFetchGET } from "../utils/backendFetch"

export default function Layout(props) {

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        backendFetchGET('/getUserInfo', async (response) => {
            if (response.status == 200) {
                let userInfo = await response.json();
                window.location.replace('/' + userInfo.user_type);
            }
            else {
                setLoading(false);
            }
        });

    }, [])

    if(loading) return (<p>loading...</p>);
    else return (<>{props.children}</>);

}