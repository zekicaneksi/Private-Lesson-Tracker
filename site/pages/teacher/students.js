import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import stylesTeachersGuardians from '../../styles/student/TeachersGuardians.module.css';
import StudentList from '../../components/teacher_guardian_common/StudentList.js';
import RequestList from '../../components/teacher_guardian_common/RequestList.js';
import StudentInfo from '../../components/teacher_guardian_common/StudentInfo.js';
import { useEffect, useState } from 'react';
import { backendFetchPOST } from '../../utils/backendFetch.js';

export default function Students() {

    const [loading, setLoading] = useState(true)
    const [studentList, setStudentList] = useState([]);
    const [selectedRelationId, setSelectedRelationId] = useState(null);

    useEffect(() => {
        if(studentList.length <= 0) return;
        if(studentList[0].lessonList != undefined) return;
        backendFetchPOST('/getTeacherStudentLesson', {
            userIds: studentList.map(student => student.user_id)
        }, async (response) => {
            let res = await response.json();
            setStudentList(old => {
                let toReturn = JSON.parse(JSON.stringify(old));
                toReturn.forEach((student, index) => {
                    toReturn[index].lessonList = [];
                });
                res.forEach(studentLesson => {
                    let studentIndex = toReturn.findIndex(student => student.user_id == studentLesson.student_id);
                    toReturn[studentIndex].lessonList.push(studentLesson);
                })
                return toReturn;
            })
        });
    }, [studentList]);

    let givenLessonsElems = [];
    let studentIndex = studentList.findIndex(user => user.relation_id == selectedRelationId);
    if(studentList[studentIndex]?.lessonList != undefined) {
        givenLessonsElems = studentList[studentIndex].lessonList.map(studentLesson => {
            let optionText = "("+ studentLesson.lesson_id + ") " + studentLesson.name;
            return <option key={studentLesson.lesson_id} value={studentLesson.lesosn_id}>{optionText}</option>
        })
    }

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

            <div className={`fieldContainer ${stylesTeachersGuardians.heightFitContent}`}>
                <p>Verdiğim Dersler</p>
                <select size={5} className={`${stylesTeachersGuardians.selectMinWidth}`}>
                    {givenLessonsElems}
                </select>
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