import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/teacher/payments.module.css'
import Image from 'next/image.js';
import Img_Back from '../../public/left-arrow.svg';
import { useState, useEffect } from 'react';
import MainPage from '../../components/teacher/page_payments/MainPage.js';
import PastPaymentsPage from '../../components/teacher/page_payments/PastPaymentsPage.js';
import Popup from '../../components/Popup.js';

export default function Payments(props) {

    const [navInfo, setNavInfo] = useState("main");
    const [popupInfo, setPopupInfo] = useState({ msg: "", show: false });
    const [loading, setLoading] = useState(true);

    function showPopup(msg){
        setPopupInfo({msg: msg, show:true });
    }

    function getPageComponent() {
        switch (navInfo) {
            case "pastPayments":
                return <PastPaymentsPage />
                break;

            default:
                return <MainPage showPopup={showPopup} setLoading={setLoading}/>
                break;
        }
    }


    return (
        <>
            <Popup
                message={popupInfo.msg}
                show={popupInfo.show}
                setPopupInfo={setPopupInfo} />

            <div className={`${loading ? 'disabled' : ''}`}>
                <div className={`${styles.navContainer}`}>
                    {navInfo == "main" ? (
                        <>
                            <button onClick={() => setNavInfo("pastPayments")}>Ödeme Geçmişi</button>
                        </>
                    ) : (
                        <>
                            <Image
                                src={Img_Back}
                                alt="Back button"
                                onClick={() => setNavInfo("main")} />
                        </>
                    )}
                </div>
                {getPageComponent()}
            </div>
        </>
    )
}

Payments.getLayout = function getLayout(Payments) {

    return (
        <Layout routes={teacherRoutes}>
            {Payments}
        </Layout>
    );
}