import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/TeachersGuardians.module.css';
import AddTeacherGuardian from '../../components/student/AddTeacherGuardian.js';
import SentRequests from '../../components/student/SentRequests.js';
import TeacherGuardianList from '../../components/student/TeacherGuardianList.js';
import { useState } from 'react';

export default function Teachers() {

    const [sentRequests, setSentRequests] = useState([]);

    return (
        <div className={styles.pageContainer}>

            <div className={styles.sideContainer}>
                <TeacherGuardianList type="teacher"/>
            </div>

            <div className={styles.sideContainer}>
                <AddTeacherGuardian 
                type="teacher"
                setSentRequests = {setSentRequests}/>
                <SentRequests 
                type = "teacher"
                sentRequests = {sentRequests}
                setSentRequests = {setSentRequests}/>
            </div>

        </div>
    )
}

Teachers.getLayout = function getLayout(Teachers) {

    return (
        <Layout routes={studentRoutes}>
            {Teachers}
        </Layout>
    );
}