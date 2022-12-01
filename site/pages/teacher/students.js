import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import stylesTeachersGuardians from '../../styles/student/TeachersGuardians.module.css';
import StudentList from '../../components/teacher_guardian_common/StudentList.js';
import RequestList from '../../components/teacher_guardian_common/RequestList.js';
import StudentInfo from '../../components/teacher_guardian_common/StudentInfo.js';
import { useState } from 'react';

export default function Students() {

    const [loading, setLoading] = useState(true)
    const [studentList, setStudentList] = useState([]);
    const [selectedRelationId, setSelectedRelationId] = useState(null);

    return (
        <div className={`${stylesTeachersGuardians.pageContainer} ${loading ? stylesTeachersGuardians.disabled : ''}`}>

            <div className={stylesTeachersGuardians.sideContainer}>
                <StudentList 
                type = "teacher"
                studentList = {studentList}
                setStudentList = {setStudentList}
                selectedRelationId = {selectedRelationId}
                setSelectedRelationId = {setSelectedRelationId}
                setLoading={setLoading}/>
            </div>

            <div className={stylesTeachersGuardians.sideContainer}>
                <StudentInfo 
                studentList = {studentList}
                selectedRelationId = {selectedRelationId}/>
                <RequestList
                setStudentList = {setStudentList} 
                setLoading = {setLoading}/>
            </div>

        </div>
    )
}

Students.getLayout = function getLayout(Students) {

    return (
        <Layout routes = {teacherRoutes}>
            {Students}
        </Layout>
    );
}