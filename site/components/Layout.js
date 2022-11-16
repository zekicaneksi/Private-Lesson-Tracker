import styles from './Layout.module.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {backendFetchGET} from '../utils/backendFetch.js';

function NotificationBar(props){
    
    return(
        <>
            <p>user id: {props.userInfo.user_id}</p>
            <p>user name: {props.userInfo.name}</p>
            <p>user surname: {props.userInfo.surname}</p>
            <p>user type: {props.userInfo.user_type}</p>
        </>
    );
}

export default function Layout(props){

    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        backendFetchGET('/getUserInfo', async (response) => {
            if(response.status == 200){
                let userInfo = await response.json();
                
                if(('/' + userInfo.user_type) != window.location.pathname){
                    window.location.replace('/'+ userInfo.user_type);
                } else {
                    setUserInfo(userInfo);
                    setLoading(false);
                }
            }
            else {
                window.location.replace('/signin');
            }
        });
    },[]);

    const navbarComponents = props.routes.map((route) => {
        return (
            <Link
            key={route.route}
            href={route.route}>
                {route.name}</Link>
        );
    })

    if(loading){
        return (<p>loading...</p>);
    }
    else{
        return(
            <div className={styles.container}>
                <div className={styles.navbar}>
                {navbarComponents}
                </div>
                <div className={styles.contentOuterContainer}>
                    <div className={styles.topBarContainer}>
                        <NotificationBar userInfo = {userInfo}/>
                    </div>
                    <div className={styles.contentContainer}>
                        {props.children}
                    </div>
                </div>
            </div>
        );
    }
}