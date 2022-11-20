import styles from './Layout.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../utils/backendFetch.js';

function NotificationBar(props) {

    return (
        <div className={styles.notificationBarContainer}>
            <p>{props.userInfo.name} {props.userInfo.surname}</p>
            <p>ID:{props.userInfo.user_id}</p>
            <button>NOTF</button>
        </div>
    );
}

export default function Layout(props) {

    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        backendFetchGET('/getUserInfo', async (response) => {
            if (response.status == 200) {
                let userInfo = await response.json();

                if (('/' + userInfo.user_type) != window.location.pathname) {
                    window.location.replace('/' + userInfo.user_type);
                } else {
                    setUserInfo(userInfo);
                    setLoading(false);
                }
            }
            else {
                window.location.replace('/signin');
            }
        });
    }, []);

    function signoutBtnHandle(){
        backendFetchGET('/signout', async (req,res) => {
            window.location.replace('/signin');
        });
    }

    let navbarComponents = props.routes.map((route) => {
        let isSelected = (route.route == router.pathname ? true : false);
        return (
            <Link className={`${styles.link} ${isSelected ? styles.linkSelected : ''}`}
                key={route.route}
                href={route.route}>
                {route.name}</Link>
        );
    });

    navbarComponents.push(
        <Link className={`${styles.link}`}
            key='/signout'
            href=''
            onClick={signoutBtnHandle}>
            Çıkış Yap</Link>
    )

    if (loading) {
        return (<p>loading...</p>);
    }
    else {
        return (
            <div className={styles.container}>
                <div className={`${styles.navbar}`}>
                    {navbarComponents}
                </div>
                <div className={styles.contentOuterContainer}>
                    <div className={styles.topBarContainer}>
                        <NotificationBar userInfo={userInfo} />
                    </div>
                    <div className={styles.contentContainer}>
                        {props.children}
                    </div>
                </div>
            </div>
        );
    }
}