import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions.js';
import styles from '../../styles/guardian/assignments.module.css';

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
    props.assignmentList?.forEach(assignment => {
        if ((assignment.lesson_id != filterLessonId && filterLessonId != 'all')) return;

        let optionText = assignment.header + ' - ' + dateToString(new Date(assignment.due));
        assignmentElems.push(<option key={assignment.assignment_id} value={assignment.assignment_id}>{optionText}</option>);
    });

    if (selectedAssignmentId == '' && assignmentElems.length > 0) setSelectedAssignmentId(assignmentElems[0].props.value);


    let selectedAssignmentContent = props.assignmentList?.find(assignment => assignment.assignment_id == selectedAssignmentId)?.content

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
                    onChange={(event) => { setSelectedAssignmentId(event.target.value) }}>
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
        assignmentList: [],
        lessonList: []
    });

    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        backendFetchGET('/getGuardianAssignments', async (response) => {
            if (response.status == 200) {
                setAssignmentList(await response.json());
            }
        });
    }, []);

    useEffect(() => {
        if (assignmentList.assignmentList.length != 0) setSelectedStudentId(assignmentList.assignmentList[0].user_id);
    }, [assignmentList]);

    const studentElems = assignmentList.assignmentList.map(elem => {
        let optionText = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        return <option key={elem.user_id} value={elem.user_id}>{optionText}</ option>
    });

    let holdList = assignmentList.assignmentList.find(relation => relation.user_id == selectedStudentId);

    return (
        <div className={`${styles.pageContainer}`}>
            <div className={`${styles.displayFlex} ${styles.flexGap}`}>
                <p>Öğrenci:</p>
                <select value={selectedStudentId}
                    onChange={(event) => { setSelectedStudentId(event.target.value) }}>
                    {studentElems}
                </select>
            </div>
            <div>
                <h2>Aktif Ödevler</h2>
                <AssignmentsSection assignmentList={holdList?.assignments.activeAssignments} lessonList={assignmentList.lessonList} />
            </div>
            <div>
                <h2>Geçmiş Ödevler</h2>
                <AssignmentsSection assignmentList={holdList?.assignments.pastAssignments} lessonList={assignmentList.lessonList} />
            </div>
        </div>
    )
}

Assignments.getLayout = function getLayout(Assignments) {

    return (
        <Layout routes={guardianRoutes}>
            {Assignments}
        </Layout>
    );
}