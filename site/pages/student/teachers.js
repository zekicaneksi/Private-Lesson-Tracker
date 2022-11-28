import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/Teachers.module.css';
import AddTeacherGuardian from '../../components/student/AddTeacherGuardian.js';
import SentRequests from '../../components/student/SentRequests.js';
import { useState } from 'react';

export default function Teachers() {

    const [sentRequests, setSentRequests] = useState([]);

    return (
        <div className={styles.pageContainer}>

            <div>
                <div className={`fieldContainer`}>
                    <p>Öğretmen Listesi</p>
                    <div className={styles.fieldPair}>
                        <p>ID:</p>
                        <input></input>
                    </div>
                </div>
            </div>

            <div className={styles.sideContainer}>
                <AddTeacherGuardian 
                type="teacher"
                setSentRequests = {setSentRequests}/>
                <SentRequests 
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