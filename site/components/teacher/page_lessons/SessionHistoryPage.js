import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import TransferBox from '../../TransferBox';
import styles from './SessionHistoryPage.module.css';

function PastLessons(props){

    const [selectedSessionId, setSelectedSessionId] = useState('');

    useEffect(() => {
        setSelectedSessionId('');
    }, [props.sessionList]);

    const sessionListElems = props.sessionList.sessionList?.map(elem => {
        elem.date = new Date(elem.date);
        if (elem.date < new Date() && elem.attendance_registered == true) {
            let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.session_name;
            return <option key={elem.session_id} value={elem.session_id}>{text}</option>
        }
    });

    let studentsThatDidCome = [];
    let studentsThatDidNotCome = [];

    if(selectedSessionId != ''){
        let attendanceList = props.sessionList.sessionList?.find(elem => elem.session_id == selectedSessionId).attendanceList;
        attendanceList.forEach(elem => {
            let user = props.sessionList.userList.find(usr => usr.user_id == elem.student_id);
            let optionText = user.name + ' ' + user.surname + ' ' + (user.nickname != '' ? ('(' + user.nickname + ')') : '');
            const optionElem = <option key={user.user_id}>{optionText}</option>
            if (elem.existent == 0) studentsThatDidNotCome.push(optionElem);
            else studentsThatDidCome.push(optionElem);
        });
    }

    return(
        <div className={`fieldContainer ${styles.flex} ${styles.flex} ${styles.flexGap}`}>
            <p>Geçmiş Seanslar</p>
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
    )
}

function AttendanceField(props) {

    const [studentList, setStudentList] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');

    useEffect(() => {
        if (props.sessionList.userList != undefined) {
            setStudentList(props.sessionList.studentsTakingTheLesson.map(elem => {
                elem.side = "left";
                elem.optionText = elem.name + ' ' + elem.surname + ' ' + (elem.nickname != '' ? ('(' + elem.nickname + ')') : '');
                return elem;
            }));
        }
        let elem = props.sessionList.sessionList?.find(elem => {if (new Date(elem.date) < new Date() && elem.attendance_registered == false) return true;});
        if (elem != undefined) setSelectedSessionId(elem.session_id);
    }, [props.sessionList]);

    function selectOnChange(event){
        setSelectedSessionId(event.target.value);
        setStudentList(old => {
            let toReturn = [...old];
            toReturn.forEach((elem, index) => {
                toReturn[index].side = "left";
            })
            return toReturn;
        })
    }

    function takeAttendanceBtnHandle(){

        props.setLoading(true);

        backendFetchPOST('/registerAttendance', {
            lesson_id: props.lessonId,
            session_id : selectedSessionId,
            studentList: studentList.map(elem => {return {user_id: elem.user_id, existent: (elem.side == "left" ? true : false)}}) 
        }, async (response) => {
            if(response.status == 200){
                props.setSessionList(old => {
                    let toReturn = {...old};
                    let sessionIndex = toReturn.sessionList.findIndex(elem => elem.session_id == selectedSessionId);
                    toReturn.sessionList[sessionIndex].attendance_registered = 1;
                    toReturn.sessionList[sessionIndex].attendanceList = studentList.map(elem => {return {student_id: elem.user_id, existent: (elem.side == "left" ? 1 : 0)}})
                    return toReturn;
                });
                setSelectedSessionId('');
                props.setLoading(false);
            }
        })
    }

    const selectElems = props.sessionList.sessionList?.map(elem => {
        elem.date = new Date(elem.date);
        if (elem.date < new Date() && elem.attendance_registered == false) {
            let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.session_name;
            return <option key={elem.session_id} value={elem.session_id}>{text}</option>
        }
    });


    return (
        <div className={`fieldContainer ${styles.flex} ${styles.flex} ${styles.flexGap}`}>
            <p>İşlenen Derslerin Yoklama Girişi</p>
            <select size={5} onChange={(event) => {selectOnChange(event)}}
            value={selectedSessionId}>
                {selectElems}
            </select>
            <div className={`${styles.transferDiv} ${styles.flexGap} ${selectedSessionId == '' ? 'disabled' : ''}`}>
                <TransferBox
                    leftSideLabel="Gelen Öğrenciler"
                    rightSideLabel="Gelmeyen Öğrenciler"
                    elemArray={studentList}
                    setElemArray={setStudentList} />
                <button onClick={takeAttendanceBtnHandle}>Yoklamayı al</button>
            </div>
        </div>
    );
}

export default function SessionHistoryPage(props) {

    const [sessionList, setSessionList] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        backendFetchGET('/getSessionHistoryById?lessonId=' + props.lessonInfo.lesson_id, async (response) => {
            if (response.status == 200) {

                let res = await response.json();
                
                setSessionList(res);

                setLoading(false);
            }
        })
    }, [])

    return (
        <div className={`${loading ? 'disabled' : ''} ${styles.container}`}>
            <h3 className={styles.lessonName}>{props.lessonInfo.lesson_name}</h3>
            <AttendanceField sessionList={sessionList} setSessionList={setSessionList} setLoading={setLoading} lessonId = {props.lessonInfo.lesson_id}/>
            <PastLessons sessionList={sessionList}/>
        </div>
    );
}