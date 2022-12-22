import styles from './EndedLessonsPage.module.css';
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';

function EndedLesson(props) {

    const [sessionList, setSessionList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getGuardianSessionHistoryById?lessonId=' + props.lessonInfo.lesson_id + '&userId=' + props.userId, async (response) => {
            if (response.status == 200) {
                setSessionList(await response.json());
            }
        })
    }, []);

    const sessionListElems = sessionList.map(elem => {
        elem.date = new Date(elem.date);
        let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name + ' * Katılım ' + (elem.existent == true ? 'var' : 'YOK');
        return <option key={elem.session_id} value={elem.session_id}>{text}</option>
    });

    let teacherName = props.lessonInfo.teacher_name + ' ' + props.lessonInfo.teacher_surname + ((props.lessonInfo.nickname != '' && props.lessonInfo.nickname != null) ? (' (' + props.lessonInfo.nickname + ')') : '');

    return (
        <div className={`fieldContainer ${styles.flex} ${styles.flexGap} ${styles.flexColumn}`}>
            <p>{props.lessonInfo.lesson_name}</p>
            <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                <div>
                    <p>Seanslar</p>
                    <select size={5}>
                        {sessionListElems}
                    </select>
                </div>
                <p>Öğretmen: {teacherName}</p>
            </div>
        </div>
    );
}

export default function EndedLessonsPage(props){
    const [endedLessons, setEndedLessons] = useState([]);

    useEffect(() => {
        backendFetchGET('/getGuardianEndedLessons?userId=' + props.userInfo.userId, async (response) => {
            if (response.status == 200) {
                setEndedLessons(await response.json());
            }
        })
    }, []);

    const endedLessonElems = endedLessons.map(elem => {
        return <EndedLesson key={elem.lesson_id} lessonInfo={elem} userId={props.userInfo.userId}/>
    })

    return (
        <div className={`${styles.container} ${styles.flexWrap}`}>
            <h3 className={`${styles.textAlignCenter} ${styles.noMarginTopBottom}`}>Sonlanmış Dersler</h3>
            <p>Öğrenci: {props.userInfo.name}</p>
            {(endedLessons.length == 0 && <p className={styles.textAlignCenter}>Sonlanmış dersiniz bulunmamaktadır</p>)}
            {endedLessonElems}
        </div>
    );
}