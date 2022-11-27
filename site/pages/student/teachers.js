import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/Teachers.module.css';
import AddTeacherGuardian from '../../components/AddTeacherGuardian.js';

export default function Teachers() {

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
                type="teacher"/>
                <div className={`fieldContainer`}>
                    <p>Giden İstekler</p>
                    <div className={styles.fieldPair}>
                        <p>ID:</p>
                        <input></input>
                    </div>
                </div>
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