import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.js';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import { dateToString } from '../../utils/formatConversions.js';
import WeeklyScheduleTable from '../../components/WeeklyScheduleTable.js';
import styles from '../../styles/teacher/index.module.css';
import TransferBox from '../../components/TransferBox.js';
import { useRouter } from 'next/router'

function Attendance(props) {

    const [loading, setLoading] = useState(true);
    const [attendanceList, setAttendanceList] = useState();

    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [studentList, setStudentList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getTeacherUpcomingAttendance', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setAttendanceList(res);
                setLoading(false);
            }
        })
    }, []);

    useEffect(() => {
        if (attendanceList == undefined) return;
        if (attendanceList.sessionList.length > 0) setSelectedSessionId(attendanceList.sessionList[0].session_id);
        else setSelectedSessionId('');
    }, [attendanceList])

    useEffect(() => {
        if (selectedSessionId == '') return;
        let lessonId = attendanceList.sessionList.find(session => session.session_id == selectedSessionId).lesson_id;
        let lesson = attendanceList.lessonList.find(lesson => lesson.lesson_id == lessonId);
        setStudentList(lesson.studentsTakingTheLesson.map(id => {
            let elem = attendanceList.userList.find(usr => usr.user_id == id);
            elem.side = "left";
            elem.optionText = elem.name + ' ' + elem.surname + ' ' + (elem.nickname != '' ? ('(' + elem.nickname + ')') : '');
            return elem;
        }));
    }, [selectedSessionId]);

    function takeAttendanceBtnHandle() {
        setLoading(true);

        let lessonId = attendanceList.sessionList.find(session => session.session_id == selectedSessionId).lesson_id;
        backendFetchPOST('/registerAttendance', {
            lesson_id: lessonId,
            session_id: selectedSessionId,
            studentList: studentList.map(elem => { return { user_id: elem.user_id, existent: (elem.side == "left" ? true : false) } })
        }, async (response) => {
            if (response.status == 200) {
                setAttendanceList(old => {
                    let toReturn = JSON.parse(JSON.stringify(old));
                    let sessionIndex = toReturn.sessionList.findIndex(elem => elem.session_id == selectedSessionId);
                    toReturn.sessionList.splice(sessionIndex, 1);
                    return toReturn;
                });
                setLoading(false);
            }
        })
    }

    const selectOptionElems = attendanceList?.sessionList.map(session => {
        let lessonName = attendanceList.lessonList.find(lesson => lesson.lesson_id == session.lesson_id).lesson_name;
        let optionText = dateToString(new Date(session.date)) + ' ' + session.start_time.substring(0, 5) + ' - ' + session.end_time.substring(0, 5) + " " + lessonName + ' - ' + session.session_name;
        return <option key={session.session_id} value={session.session_id}>{optionText}</option>
    });

    return (
        <div className={`${loading ? 'disabled' : ''} fieldContainer ${styles.displayFlex} ${styles.flexColumn} ${styles.flexSmallGap}`}>
            <p>İşlenen Derslerin Yoklama Girişi</p>
            <select size={5} className={`${selectedSessionId == '' ? 'disabled' : ''}`}
                value={selectedSessionId}
                onChange={(event) => { setSelectedSessionId(event.target.value) }}>
                {selectOptionElems}
            </select>
            <TransferBox
                leftSideLabel="Gelen Öğrenciler"
                rightSideLabel="Gelmeyen Öğrenciler"
                elemArray={studentList}
                setElemArray={setStudentList} />
            <button onClick={takeAttendanceBtnHandle} className={`${selectedSessionId == '' ? 'disabled' : ''}`}>Kaydet</button>
        </div>
    )
}

function Payments(props) {

    const router = useRouter()

    const [paymentList, setPaymentList] = useState({});

    useEffect(() => {
        backendFetchGET('/getTeacherPayments', async (response) => {
            if (response.status == 200) {
                setPaymentList(await response.json());
            }
        })
    }, []);

    const optionElems = paymentList.paymentList?.map(payment => {
        let dateToCompare = new Date();
        dateToCompare.setDate(dateToCompare.getDate() + 3);
        if (new Date(payment.due) > dateToCompare) return;
        let usr = paymentList.userList.find(usr => usr.user_id == payment.student_id);
        let usrText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        let lesson = paymentList.lessonList.find(lesson => lesson.lesson_id == payment.lesson_id);
        let text = dateToString(new Date(payment.due)) + ' - ' + payment.amount.substring(0, payment.amount.toString().indexOf('.')) + ' TL ' + usrText + ' - ' + lesson.lesson_name;
        return <option key={payment.payment_id} value={payment.payment_id}>{text}</option>
    })

    return (
        <div className={`${styles.fullWidth} fieldContainer ${styles.displayFlex} ${styles.flexColumn} ${styles.flexSmallGap}`}>
            <p>Vakti Yaklaşan Ödemeler</p>
            <select size={5}>
                {optionElems}
            </select>
            <button onClick={() => {router.push('/teacher/payments')}}
            className={`${optionElems?.length == 0 ? 'disabled' : ''}`}>Ödemelere Git</button>
        </div>
    )
}

function Assignments(props) {

    const router = useRouter()

    const [assignmentList, setAssignmentList] = useState(null);

    useEffect(() => {
        backendFetchGET('/getTeacherAssignments', async (response) => {
            if (response.status == 200) {
                setAssignmentList(await response.json());
            }
        })
    }, [])


    let optionElems = [];
    if (assignmentList != null) {
        let dateToCompare = new Date();
        dateToCompare.setDate(dateToCompare.getDate() + 3);
        assignmentList.lessonList.forEach(lesson => {
            lesson.assignmentList.forEach(assignment => {
                if (new Date(assignment.due) > dateToCompare) return;
                let optionText = assignment.header + ' - ' + dateToString(new Date(assignment.due));
                optionElems.push(<option key={assignment.assignment_id} value={assignment.due}>{optionText}</option>);
            })
        })
        optionElems.sort((a, b) => {
            return (new Date(a.props.value)).getTime() - (new Date(b.props.value)).getTime();
        })
    }


    return (
        <div className={`${styles.fullWidth} fieldContainer ${styles.displayFlex} ${styles.flexColumn} ${styles.flexSmallGap}`}>
            <p>Vakti Yaklaşan Ödevler</p>
            <select size={5}>
                {optionElems}
            </select>
            <button onClick={() => {router.push('/teacher/assignments')}}
            className={`${optionElems?.length == 0 ? 'disabled' : ''}`}>Ödevlere Git</button>
        </div>
    );
}

function Schedule(props) {

    const [scheduleWeekArr, setScheduleWeekArr] = useState([]);

    useEffect(() => {
        backendFetchGET('/getTeacherSchedule', async (response) => {
            if (response.status == 200) {
                let res = await response.json();

                let currDate = new Date();
                let lastMonday = new Date();
                let daysDiff = currDate.getDay() - 1;
                lastMonday.setDate(currDate.getDate() - (daysDiff > 0 ? daysDiff : (daysDiff * -6)));
                lastMonday.setHours(0, 0, 0, 0);
                let arr = [];

                arr.push({
                    weekDate: lastMonday, days: {
                        "0": [],
                        "1": [],
                        "2": [],
                        "3": [],
                        "4": [],
                        "5": [],
                        "6": [],
                    }
                });

                res.forEach(elem => {
                    let date = new Date(elem.date);
                    let arrDate = new Date();
                    let dateDiff = date.getDay() - 1;
                    arrDate.setDate(date.getDate() - (dateDiff > 0 ? dateDiff : (dateDiff * -6)));
                    arrDate.setHours(0, 0, 0, 0);
                    let index = arr.findIndex(arrElem => arrElem.weekDate.getTime() == arrDate.getTime());
                    if (index == -1) return;
                    let dayIndex = date.getDay() + (date.getDay() != 0 ? -1 : +6);
                    arr[index].days[dayIndex].push({
                        day: dayIndex,
                        startTime: elem.start_time.substring(0, 5),
                        endTime: elem.end_time.substring(0, 5),
                        sessionName: elem.session_name,
                        lessonName: elem.lesson_name
                    });
                });

                setScheduleWeekArr(arr);

            }
        });
    }, []);

    const scheduleTableElems = scheduleWeekArr.map((elem, index) => {
        elem.weekDate = new Date(elem.weekDate)
        return (
            <div key={index} className={`fieldContainer ${styles.fullWidth}`}>
                <p>{dateToString(elem.weekDate)}</p>
                <WeeklyScheduleTable content={elem.days} />
            </div>
        )
    })

    return (
        <div>
            {scheduleTableElems}
        </div>
    )
}

export default function Index() {

    return (
        <div className={`${styles.pageContainer} globalFieldContainerPadding ${styles.flexGap}`}>
            <Schedule />
            <div className={`${styles.displayFlex} ${styles.flexGap} ${styles.fullWidth}`}>
                <Attendance />
                <div className={`${styles.displayFlex} ${styles.flexColumn} ${styles.containSelect} ${styles.flexGap}`}>
                    <Assignments />
                    <Payments />
                </div>
            </div>
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes={teacherRoutes}>
            {Index}
        </Layout>
    );
}