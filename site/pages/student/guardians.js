import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/TeachersGuardians.module.css';
import AddTeacherGuardian from '../../components/student/AddTeacherGuardian.js';
import SentRequests from '../../components/student/SentRequests.js';
import TeacherGuardianList from '../../components/student/TeacherGuardianList.js';
import { useState } from 'react';

export default function Guardians() {

    const [sentRequests, setSentRequests] = useState([]);

    return (
        <div className={styles.pageContainer}>

            <div className={styles.sideContainer}>
                <TeacherGuardianList type="guardian"/>
            </div>

            <div className={styles.sideContainer}>
                <AddTeacherGuardian 
                type="guardian"
                setSentRequests = {setSentRequests}/>
                <SentRequests 
                type="guardian"
                sentRequests = {sentRequests}
                setSentRequests = {setSentRequests}/>
            </div>

        </div>
    );
}

Guardians.getLayout = function getLayout(Guardians) {

    return (
        <Layout routes = {studentRoutes}>
            {Guardians}
        </Layout>
    );
}