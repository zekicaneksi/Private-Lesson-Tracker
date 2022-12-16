import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import styles from './EndedLessonsPage.module.css';

function EndedLesson(props) {

    const [selectedSessionId, setSelectedSessionId] = useState('');

    const sessionListElems = props.lessonInfo.sessionList?.map(elem => {
        elem.date = new Date(elem.date);
        let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name;
        return <option key={elem.session_id} value={elem.session_id}>{text}</option>
    });

    let studentsThatDidCome = [];
    let studentsThatDidNotCome = [];

    if (selectedSessionId != '') {
        let attendanceList = props.lessonInfo.sessionList.find(elem => elem.session_id == selectedSessionId).attendanceList;
        attendanceList.forEach(elem => {
            let user = props.uniqueUserInfo.find(usr => usr.user_id == elem.student_id);
            let optionText = user.name + ' ' + user.surname + ' ' + (user.nickname != '' ? ('(' + user.nickname + ')') : '');
            const optionElem = <option key={user.user_id}>{optionText}</option>
            if (elem.existent == 0) studentsThatDidNotCome.push(optionElem);
            else studentsThatDidCome.push(optionElem);
        });
    }

    const studentsTakingTheLesson = props.lessonInfo.studentsTakingTheLesson.map(elem => {
        let user = props.uniqueUserInfo.find(usr => usr.user_id == elem);
        let optionText = user.name + ' ' + user.surname + ' ' + (user.nickname != '' ? ('(' + user.nickname + ')') : '');
        return <option key={user.user_id}>{optionText}</option>
    });

    return (
        <div className={`fieldContainer ${styles.flex} ${styles.flexGap} ${styles.flexColumn}`}>
            <p>{props.lessonInfo.lesson_name}</p>
            <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap}`}>
                <div>
                    <p>Seanslar</p>
                    <select size={5} onChange={(event) => setSelectedSessionId(event.target.value)}>
                        {sessionListElems}
                    </select>
                </div>
                <div>
                    <p>Gelen Öğrenciler</p>
                    <select size={5}>
                        {studentsThatDidCome}
                    </select>
                </div>
                <div>
                    <p>Gelmeyen Öğrenciler</p>
                    <select size={5}>
                        {studentsThatDidNotCome}
                    </select>
                </div>
            </div>
            <div>
                <p>Dersi Alan Öğrenciler</p>
                <select size={5}>
                    {studentsTakingTheLesson}
                </select>
            </div>
        </div>
    );
}

export default function EndedLessonsPage(props) {

    const [loading, setLoading] = useState(true);
    const [endedLessons, setEndedLessons] = useState({
        lessonList: [],
        uniqueUserInfo: []
    });

    useEffect(() => {
        backendFetchGET('/getTeacherEndedLessons', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setEndedLessons(res);
                setLoading(false);
            }
        })
    }, []);

    const endedLessonElems = endedLessons.lessonList.map(elem => {
        return <EndedLesson key={elem.lesson_id} lessonInfo={elem} uniqueUserInfo={endedLessons.uniqueUserInfo} />
    })

    return (
        <div className={`${styles.container} ${loading ? 'disabled' : ''}`}>
            <h3 className={`${styles.textAlignCenter} ${styles.noMarginTopBottom}`}>Sonlanmış Dersler</h3>
            {(endedLessons.lessonList.length == 0 && <p className={styles.textAlignCenter}>Sonlanmış dersiniz bulunmamaktadır</p>)}
            {endedLessonElems}
        </div>
    );
}