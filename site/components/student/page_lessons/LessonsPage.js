import styles from './LessonsPage.module.css';
import { useState, useEffect } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { convertTimeToMinutes, dateToString } from '../../../utils/formatConversions';
import { useRouter } from 'next/router'

function LessonBox(props) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [sessionList, setSessionList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getStudentLessonInfoById?lessonId=' + props.lessonInfo.lesson_id, async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                res.forEach((element, index) => {
                    res[index].date = new Date(res[index].date);
                });
                setSessionList(res);
                setLoading(false);
            }
        });
    }, []);

    function sendMsgBtnHandle(type){
        let label;
        if (type == 'lesson'){
            label = '('+props.lessonInfo.lesson_id+') ' + props.lessonInfo.lesson_name;
        } else {
            label = props.lessonInfo.teacher_name + ' ' + props.lessonInfo.teacher_surname + ((props.lessonInfo.nickname != '' && props.lessonInfo.nickname != null) ? (' (' + props.lessonInfo.nickname + ')') : '');
        }

        router.push({
            pathname: '/student/messages',
            query: {
                label: label,
                typeInfo_name: type,
                typeInfo_id: (type == 'lesson' ? props.lessonInfo.lesson_id : props.lessonInfo.teacher_id)
            }
        }, '/student/messages');
    }

    const sessionElems = sessionList.map((elem, index) => {
        if (elem.date > new Date()) {
            let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name;
            return <option key={elem.session_id} value={elem.session_id}>{text}</option>
        }
    });

    let teacherName = props.lessonInfo.teacher_name + ' ' + props.lessonInfo.teacher_surname + ((props.lessonInfo.nickname != '' && props.lessonInfo.nickname != null) ? (' (' + props.lessonInfo.nickname + ')') : '');

    return(
        <div className={`fieldContainer ${loading ? 'disabled' : ''} ${styles.flex} ${styles.flexRow} globalFieldContainerPadding ${styles.flexGap} ${styles.flexJustifyCenter}`}>
            <p>{'('+props.lessonInfo.lesson_id + ') '+ props.lessonInfo.lesson_name}</p>
            <div className={`${styles.flex} ${styles.flexColumn}`}>
                <button className={`${styles.marginLeftAuto}`}
                    onClick={() => { props.setNavInfo({lesson_name: props.lessonInfo.lesson_name, lesson_id: props.lessonInfo.lesson_id}); }}>Seans Geçmişi</button>
                <select size={5}>
                    {sessionElems}
                </select>
                <p>Öğretmen: {teacherName}</p>
                <button onClick={() => {sendMsgBtnHandle('personal')}}>Öğretmene Mesaj Gönder</button>
                <button onClick={() => {sendMsgBtnHandle('lesson')}}>Ders Grubuna Mesaj Gönder</button>
            </div>
        </div>
    );

}

export default function LessonsPage(props) {

    const [lessonList, setLessonList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getStudentLessons', async (response) => {
            if (response.status == 200) {
                setLessonList(await response.json());
            }
        })
    }, []);

    const lessonBoxList = lessonList.map(elem => {
        return <LessonBox key={elem.lesson_id} lessonInfo={elem} setNavInfo={props.setNavInfo}/>
    })

    return (
        <div className={`${styles.pageContainer}`}>
            {lessonBoxList}
        </div>
    );
}