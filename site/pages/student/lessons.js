import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/lessons.module.css';
import Image from 'next/image.js';
import Img_Back from '../../public/left-arrow.svg';
import { useState, useEffect } from 'react';
import EndedLessonsPage from '../../components/student/page_lessons/EndedLessonsPage.js';
import LessonsPage from '../../components/student/page_lessons/LessonsPage.js';
import SessionHistoryPage from '../../components/student/page_lessons/SessionHistoryPage.js';

export default function Lessons() {

    const [navInfo, setNavInfo] = useState("lessonsPage");

    function getPageComponent() {
        switch (navInfo) {
            case "lessonsPage":
                return <LessonsPage setNavInfo={setNavInfo}/>
                break;

            case "endedLessonsPage":
                return <EndedLessonsPage />
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
                        <button onClick={() => setNavInfo("endedLessonsPage")}>Sonlanmış Dersler</button>
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
        <Layout routes = {studentRoutes}>
            {Lessons}
        </Layout>
    );
}