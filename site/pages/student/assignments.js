import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/assignments.module.css';
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions.js';

function AssignmentsSection(props) {

    const [filterLessonId, setFilterLessonId] = useState('all');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

    useEffect(() => {
        setSelectedAssignmentId('');
    }, [filterLessonId])

    let filterLessonElems = props.lessonList.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.lesson_name}</option>
    })
    filterLessonElems?.unshift(
        <option key={"all"} value={"all"}>Hepsi</option>
    );


    let assignmentElems = [];
    props.assignmentList.forEach(assignment => {
        if ((assignment.lesson_id != filterLessonId && filterLessonId != 'all')) return;

        let optionText = assignment.header + ' - ' + dateToString(new Date(assignment.due));
        assignmentElems.push(<option key={assignment.assignment_id} value={assignment.assignment_id}>{optionText}</option>);
    });

    if (selectedAssignmentId == '' && assignmentElems.length > 0) setSelectedAssignmentId(assignmentElems[0].props.value);


    let selectedAssignmentContent = props.assignmentList.find(assignment => assignment.assignment_id == selectedAssignmentId)?.content

    return (
        <div className={`${styles.displayFlex} ${styles.adjustFlex} ${styles.sectionContainer}`}>
            <div className={`${styles.displayFlex} ${styles.flexGap} ${styles.flexColumn}`}>
                <div className={`${styles.displayFlex} ${styles.flexGap} ${styles.justifyCenter} ${styles.flexGap}`}>
                    <p>Ders:</p>
                    <select className={`${styles.lessonSelect}`} onChange={(event) => { setFilterLessonId(event.target.value) }}
                        value={filterLessonId}>
                        {filterLessonElems}
                    </select>
                </div>
                <select size={5} value={selectedAssignmentId}
                onChange={(event) => {setSelectedAssignmentId(event.target.value)}}>
                    {assignmentElems}
                </select>
            </div>
            <div className={`${styles.displayFlex} ${styles.flexColumn} ${styles.flexGap}`}>
                <p>Ödev İçeriği</p>
                <textarea readOnly={true} value={selectedAssignmentContent}></textarea>
            </div>
        </div>
    );
}

export default function Assignments() {

    const [assignmentList, setAssignmentList] = useState({
        activeAssignments: [],
        pastAssignments: [],
        lessonList: []
    });

    useEffect(() => {
        backendFetchGET('/getStudentAssignments', async (response) => {
            if (response.status == 200) {
                setAssignmentList(await response.json());
            }
        });
    }, [])

    return (
        <div className={`${styles.pageContainer}`}>
            <div>
                <h2>Aktif Ödevler</h2>
                <AssignmentsSection assignmentList={assignmentList.activeAssignments} lessonList={assignmentList.lessonList} />
            </div>
            <div>
                <h2>Geçmiş Ödevler</h2>
                <AssignmentsSection assignmentList={assignmentList.pastAssignments} lessonList={assignmentList.lessonList} />
            </div>
        </div>
    )
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes={studentRoutes}>
            {Assignments}
        </Layout>
    );
}