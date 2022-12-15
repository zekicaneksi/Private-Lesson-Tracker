import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import Image from 'next/image.js';
import Img_Back from '../../public/left-arrow.svg';
import { useState, useEffect } from 'react';
import styles from '../../styles/teacher/lessons.module.css';
import AddLessonPage from '../../components/teacher/page_lessons/AddLessonPage.js';
import EndedLessonsPage from '../../components/teacher/page_lessons/EndedLessonsPage.js';
import LessonsPage from '../../components/teacher/page_lessons/LessonsPage.js';
import SessionHistoryPage from '../../components/teacher/page_lessons/SessionHistoryPage.js';

export default function Lessons(props) {

    const [navInfo, setNavInfo] = useState("lessonsPage");

    function getPageComponent() {
        switch (navInfo) {
            case "lessonsPage":
                return <LessonsPage setNavInfo={setNavInfo}/>
                break;

            case "addLessonPage":
                return <AddLessonPage setNavInfo={setNavInfo} />
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
                        <button onClick={() => setNavInfo("addLessonPage")}>Ders Ekle</button>
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
        <Layout routes={teacherRoutes}>
            {Lessons}
        </Layout>
    );
}