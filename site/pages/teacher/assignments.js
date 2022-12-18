import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/teacher/assignments.module.css';
import Image from 'next/image.js';
import Img_Back from '../../public/left-arrow.svg';
import MainPage from '../../components/teacher/page_assignments/MainPage.js';
import PastLessonsPage from '../../components/teacher/page_assignments/PastLessonsPage.js';
import Popup from '../../components/Popup.js';
import { backendFetchGET } from '../../utils/backendFetch.js';

export default function Assignments(props) {

    const [navInfo, setNavInfo] = useState("main");
    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState({ msg: "", show: false });

    const [givenAssignments, setGivenAssignments] = useState([]);

    useEffect(() => {

        backendFetchGET('/getTeacherAssignments', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setGivenAssignments(res);
                setLoading(false);
            }
        });

        setLoading(false);
    }, [])

    function getPageComponent() {
        switch (navInfo) {
            case "pastLessons":
                return <PastLessonsPage />
                break;

            default:
                return <MainPage setLoading={setLoading} setPopupInfo={setPopupInfo} givenAssignments={givenAssignments} setGivenAssignments={setGivenAssignments}/>
                break;
        }
    }

    return (
        <>
            <Popup
                message={popupInfo.message}
                show={popupInfo.show}
                setPopupInfo={setPopupInfo} />

            <div className={`${loading ? 'disabled' : ''}`}>
                <div className={`${styles.navContainer}`}>
                    {navInfo == "main" ? (
                        <>
                            <button onClick={() => setNavInfo("pastLessons")}>Geçmiş Ödevler</button>
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
    );
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes={teacherRoutes}>
            {Assignments}
        </Layout>
    );
}