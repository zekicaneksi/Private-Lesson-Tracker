import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import Image from 'next/image.js';
import Img_Back from '../../public/left-arrow.svg';
import { useState, useEffect } from 'react';
import styles from '../../styles/guardian/lessons.module.css';
import SessionHistoryPage from '../../components/guardian/page_lessons/SessionHistoryPage.js';
import LessonsPage from '../../components/guardian/page_lessons/LessonsPage.js';
import EndedLessonsPage from '../../components/guardian/page_lessons/EndedLessonsPage.js';

export default function Lessons() {

    const [navInfo, setNavInfo] = useState("lessonsPage");
    const [selectedUserInfo, setSelectedUserInfo] = useState(null);

    function getPageComponent() {

        switch (navInfo) {
            case "lessonsPage":
                return <LessonsPage setNavInfo={setNavInfo} setSelectedUserInfo={setSelectedUserInfo}/>
                break;

            case "endedLessonsPage":
                return <EndedLessonsPage userInfo={selectedUserInfo}/>
                break;

            default:
                return <SessionHistoryPage lessonInfo={navInfo}/>
                break;
        }
    }

    return (
        <div>
            <div className={styles.navContainer}>
                {navInfo == "lessonsPage" ? (
                    <>
                        <button onClick={() => setNavInfo("endedLessonsPage")}
                        className={(selectedUserInfo == null ? 'disabled' : '')}>Sonlanmış Dersler</button>
                    </>
                ) : (
                    <>
                        <Image
                            src={Img_Back}
                            alt="Back button"
                            onClick={() => setNavInfo("lessonsPage")} />
                    </>
                )}
            </div>
            {getPageComponent()}
        </div>
    );
}

Lessons.getLayout = function getLayout(Lessons) {

    return (
        <Layout routes = {guardianRoutes}>
            {Lessons}
        </Layout>
    );
}