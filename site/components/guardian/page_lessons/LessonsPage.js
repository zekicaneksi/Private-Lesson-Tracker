import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import styles from './LessonsPage.module.css';

function LessonBox(props) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [sessionList, setSessionList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getGuardianLessonInfoById?lessonId=' + props.lessonInfo.lesson_id + '&userId=' + props.userId, async (response) => {
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

    function sendMsgBtnHandle(type) {

        function getFullName(user) {
            return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
        }

        let label;
        let typeInfo = {};

        typeInfo.name = type == 'lesson' ? 'lesson' : 'guardian';
        
        if (type == 'teacher') {
            label = '(Öğretmeni - '+ props.lessonInfo.teacher_name + ' ' + props.lessonInfo.teacher_surname + ') '+ props.user_name;
            typeInfo.student_id = props.user_id;
            typeInfo.teacher_id = props.lessonInfo.teacher_id;
            router.push({
                pathname: '/guardian/messages',
                query: {
                    label: label,
                    typeInfo_name: typeInfo.name,
                    typeInfo_student_id: typeInfo.student_id,
                    typeInfo_teacher_id: typeInfo.teacher_id
                }
            }, '/guardian/messages');
        } else {
            label = '('+ props.lessonInfo.lesson_id + ') ' + props.lessonInfo.lesson_name;
            router.push({
                pathname: '/guardian/messages',
                query: {
                    label: label,
                    typeInfo_name: typeInfo.name,
                    typeInfo_lesson_id: props.lessonInfo.lesson_id,
                }
            }, '/guardian/messages');
        }
    }

    const sessionElems = sessionList.map((elem, index) => {
        if (elem.date > new Date()) {
            let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name;
            return <option key={elem.session_id} value={elem.session_id}>{text}</option>
        }
    });

    let teacherName = props.lessonInfo.teacher_name + ' ' + props.lessonInfo.teacher_surname + ((props.lessonInfo.nickname != '' && props.lessonInfo.nickname != null) ? (' (' + props.lessonInfo.nickname + ')') : '');

    return (
        <div className={`fieldContainer ${loading ? 'disabled' : ''} ${styles.flex} ${styles.flexRow} globalFieldContainerPadding ${styles.flexGap} ${styles.flexJustifyCenter}`}>
            <p>{'('+ props.lessonInfo.lesson_id + ') ' + props.lessonInfo.lesson_name}</p>
            <div className={`${styles.flex} ${styles.flexColumn}`}>
                <button className={`${styles.marginLeftAuto}`}
                    onClick={() => { props.setNavInfo({ lesson_name: props.lessonInfo.lesson_name, lesson_id: props.lessonInfo.lesson_id, userId: props.userId, teacher_name: teacherName, user_name: props.user_name }); }}>Seans Geçmişi</button>
                <select size={5}>
                    {sessionElems}
                </select>
                <p>Öğretmen: {teacherName}</p>
                <button onClick={() => sendMsgBtnHandle('teacher')}>Öğretmene Mesaj Gönder</button>
                <button onClick={() => sendMsgBtnHandle('lesson')}>Ders Grubuna Mesaj Gönder</button>
            </div>
        </div>
    );

}

export default function LessonsPage(props) {

    const [userList, setUserList] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        backendFetchGET('/getGuardianLessons', async (response) => {
            if (response.status == 200) {
                setUserList(await response.json());
            }
        })
    }, []);

    useEffect(() => {
        if(selectedStudentId == '') props.setSelectedUserInfo(null);
        else {
            let elem = userList.find(usr => usr.user_id == selectedStudentId);
            let name = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
            props.setSelectedUserInfo({name: name, userId: elem.user_id})
        }
    }, [selectedStudentId])

    useEffect(() => {
        if (userList.length > 0) setSelectedStudentId(userList[0].user_id);
    }, [userList])

    const studentElems = userList.map(elem => {
        let optionText = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        return <option key={elem.user_id} value={elem.user_id}>{optionText}</option>
    })

    let usr = userList.find(usr => usr.user_id == selectedStudentId);
    let usrName = (usr != undefined ? usr.name + ' ' + usr.surname + ((usr.nickname != '' && usr.nickname != null) ? (' (' + usr.nickname + ')') : '') : '');
    const lessonBoxList = usr?.lessonList.map(elem => {
        return <LessonBox key={elem.lesson_id} lessonInfo={elem} user_name={usrName} userId={selectedStudentId} setNavInfo={props.setNavInfo} />
    })

    return (
        <div  className={`${styles.pageContainer}`}>
            <div className={`${styles.flex} ${styles.flexGap}`}>
                <p>Öğrenci:</p>
                <select value={selectedStudentId}
                    onChange={(event) => { setSelectedStudentId(event.target.value) }}>
                    {studentElems}
                </select>
            </div>
            <div className={`${styles.contentContainer}`}>
                {lessonBoxList}
            </div>
        </div>
    );
}