import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import styles from './PastLessonsPage.module.css'

export default function PastLessonsPage(props) {

    const [lessonsInfo, setLessonsInfo] = useState([]);

    const [selectedLessonId, setSelectedLessonId] = useState(-1);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(-1);
    const [assignmentContentInput, setAssignmentContentInput] = useState('');

    useEffect(() => {
        backendFetchGET('/getTeacherPastAssignments', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setLessonsInfo(res);
                if (res.lessonList.length > 0) setSelectedLessonId(res.lessonList[0].lesson_id);
            }
        })
    }, [])

    useEffect(() => {
        if (selectedLessonId != -1) {
            let lessonIndex = lessonsInfo.lessonsInfo.findIndex(elem => elem.lesson_id == selectedLessonId);
            if (lessonsInfo.lessonsInfo[lessonIndex].assignmentList.length > 0)
                setSelectedAssignmentId(lessonsInfo.lessonsInfo[lessonIndex].assignmentList[0].assignment_id);
        }
    }, [selectedLessonId]);

    useEffect(() => {
        if (selectedLessonId != -1 && selectedAssignmentId != -1) {
        let lessonIndex = lessonsInfo.lessonsInfo.findIndex(elem => elem.lesson_id == selectedLessonId);
        const assignment = lessonsInfo.lessonsInfo[lessonIndex].assignmentList.find(assignment => assignment.assignment_id == selectedAssignmentId);
        setAssignmentContentInput(assignment.content);
        }
    }, [selectedAssignmentId])

    const lessonsElems = lessonsInfo.lessonsInfo?.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.name}</option>
    })

    let lessonIndex = lessonsInfo.lessonsInfo?.findIndex(lesson => lesson.lesson_id == selectedLessonId);
    let assignElems = [];
    if (lessonIndex != -1 && lessonsInfo.lessonsInfo != undefined) {
        assignElems = lessonsInfo.lessonsInfo[lessonIndex].assignmentList.map(assignment => {
            return <option key={assignment.assignment_id} value={assignment.assignment_id}>{assignment.header + ' - ' + dateToString(new Date(assignment.due))}</option>
        })
    }

    let studentsThatDidDo = [];
    let studentsThatDidNotDo = [];
    if (lessonIndex != -1 && selectedAssignmentId != -1){
        const assignment = lessonsInfo.lessonsInfo[lessonIndex].assignmentList.find(assignment => assignment.assignment_id == selectedAssignmentId);
        if(assignment != undefined){

            let holdFunc = (arr, target) => {
                arr.forEach(elem => {
                    let usr = lessonsInfo.userList.find(user => user.user_id == elem);
                    let text = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
                    target.push(
                        <option key={usr.user_id}>{text}</option>
                    )
                });    
            }
            holdFunc(assignment.studentsThatDidDo, studentsThatDidDo);
            holdFunc(assignment.studentsThatDidNotDo, studentsThatDidNotDo);
            
        }
    }

    return (
        <div className={`${styles.container} ${styles.flexBigGap}`}>
            <h3>Geçmiş Ödevler</h3>
            <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap}`}>
                <p>Ders:</p>
                <select onChange={(event) => { setSelectedLessonId(event.target.value) }}>
                    {lessonsElems}
                </select>
            </div>
            {assignElems.length != 0 ?
                <>
                    <select size={5} onChange={(event) => { setSelectedAssignmentId(event.target.value) }}>
                        {assignElems}
                    </select>
                    <div className={`${styles.flex} ${styles.flexRow} ${styles.flexBigGap}`}>
                        <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${styles.textAlignCenter}`}>
                            <p>Ödev İçeriği</p>
                            <textarea className={styles.textarea} readOnly={true}
                            value={assignmentContentInput}></textarea>
                        </div>
                        <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${styles.textAlignCenter}`}>
                            <p>Ödevi Teslim Edenler</p>
                            <select size={5}>
                                {studentsThatDidDo}
                            </select>
                        </div>
                        <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${styles.textAlignCenter}`}>
                            <p>Ödevi Teslim Etmeyenler</p>
                            <select size={5}>
                                {studentsThatDidNotDo}
                            </select>
                        </div>
                    </div>
                </> : <p>Bu derse ait geçmiş bir ödev bulunmamaktadır.</p>}
        </div>
    );
}