import styles from './Layout.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../utils/backendFetch.js';
import Image from 'next/image';
import Img_NotificatonBell from './../public/notification_bell.svg';
import Img_Cross from './../public/cross.svg';

function NotificationBar(props) {

    const [showNotifications, setShowNotifications] = useState(false);

    function dismissNotification(notification_id){
        backendFetchPOST('/dismissNotification', {notification_id : notification_id}, (response) => {
            props.setUserInfo((prevState) => {
                let newState = {...prevState};
                newState.notifications = newState.notifications.filter(notification => notification.notification_id != notification_id);
                return newState;
            })
        })
    }

    const notificationElements = props.userInfo.notifications.map((notification, index) => {
        return (
            <div key={index}
                className={styles.notificationElementContainer}>
                <p>{notification.content}</p>
                { notification.dismissable ?
                <Image 
                    src={Img_Cross}
                    alt="dismiss"
                    className={styles.dismissImg}
                    onClick={() => dismissNotification(notification.notification_id)}/>
                :
                <span></span>
                }
            </div>
        )
    });

    return (
        <div className={styles.notificationBarContainer}>
            <p>{props.userInfo.name} {props.userInfo.surname}</p>
            <p>ID:{props.userInfo.user_id}</p>
            <div className={styles.notificationBellContainer}
                onMouseOver={() => { if(props.userInfo.notifications.length > 0 ) setShowNotifications(true) }}>
                <Image
                    className={styles.test}
                    src={Img_NotificatonBell}
                    alt="Notificaton Bell" />
                {props.userInfo.notifications.length > 0 &&
                    <span className={styles.notificatonBellBadge}>{props.userInfo.notifications.length}</span>}
            </div>
            <div className={`${styles.notificationsContainer} ${(showNotifications ? styles.show : '')}`}
                onMouseLeave={() => { setShowNotifications(false) }}>
                {notificationElements}
            </div>
        </div>
    );
}

export default function Layout(props) {

    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});

    function fetchUserInfo(){
        backendFetchGET('/getUserInfo', async (response) => {
            if (response.status == 200) {
                let userInfo = await response.json();
                if (userInfo.user_type != (router.pathname.split('/'))[1]) {
                    router.replace('/');
                } else {
                    setUserInfo(userInfo);
                    setLoading(false);
                }
            }
            else {
                router.replace('/signin');
            }
        });
    }

    useEffect(() => {
        fetchUserInfo();
    }, []);

    function signoutBtnHandle() {
        backendFetchGET('/signout', async (req, res) => {
            router.replace('/signin');
        });
    }

    let navbarComponents = props.routes.map((route) => {
        let isSelected = (route.route == router.pathname ? true : false);
        return (
            <Link className={`${styles.link} ${isSelected ? styles.linkSelected : ''}`}
                key={route.route}
                href={route.route}
                onClick={fetchUserInfo}>
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
                        <NotificationBar userInfo={userInfo} 
                        setUserInfo={setUserInfo}/>
                    </div>
                    <div className={styles.contentContainer}>
                        {props.children}
                    </div>
                </div>
            </div>
        );
    }
}