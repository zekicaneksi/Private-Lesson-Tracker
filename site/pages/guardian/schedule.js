import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import { backendFetchGET } from '../../utils/backendFetch.js';
import { useEffect, useState } from 'react';
import WeeklyScheduleTable from '../../components/WeeklyScheduleTable.js';
import { dateToString } from '../../utils/formatConversions.js';
import styles from '../../styles/guardian/schedule.module.css'

export default function Schedule() {

    const [scheduleList, setScheduleList] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [scheduleWeekArr, setScheduleWeekArr] = useState([]);

    useEffect(() => {
        backendFetchGET('/getGuardianSchedule', async (response) => {
            if (response.status == 200) {
                setScheduleList(await response.json());
            }
        });
    }, []);

    useEffect(() => {
        if (scheduleList.length != 0) setSelectedStudentId(scheduleList[0].user_id);
    }, [scheduleList]);

    useEffect(() => {
        if (scheduleList.length == 0) return;
        let arr = [];

        let res = scheduleList.find(elem => elem.user_id == selectedStudentId).schedule;
        res.forEach(elem => {
            let date = new Date(elem.date);
            let arrDate = new Date(elem.date);
            let dateDiff = date.getDay() - 1;
            arrDate.setDate(date.getDate() - (dateDiff > 0 ? dateDiff : (dateDiff * -6)));
            let index = arr.findIndex(arrElem => arrElem.weekDate.getTime() == arrDate.getTime());
            if (index == -1) index = arr.push({
                weekDate: arrDate, days: {
                    "0": [],
                    "1": [],
                    "2": [],
                    "3": [],
                    "4": [],
                    "5": [],
                    "6": [],
                }
            }) - 1;
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
    }, [selectedStudentId])

    const studentElems = scheduleList.map(elem => {
        let optionText = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        return <option key={elem.user_id} value={elem.user_id}>{optionText}</ option>
    });

    const scheduleTableElems = scheduleWeekArr.map(elem => {
        elem.weekDate = new Date(elem.weekDate)
        return (
            <div key={dateToString(elem.weekDate)} className={`fieldContainer ${styles.scheduleContainer}`}>
                <p>{dateToString(elem.weekDate)}</p>
                <WeeklyScheduleTable content={elem.days} />
            </div>
        )
    })

    return (
        <div className={`${styles.container}`}>
            <div className={`${styles.flex}`}>
                <p>Öğrenci:</p>
                <select value={selectedStudentId}
                    onChange={(event) => { setSelectedStudentId(event.target.value) }}>
                    {studentElems}
                </select>
            </div>
            <div className={`${styles.container}`}>
                {scheduleTableElems.length > 0 ? scheduleTableElems : <p>Ders bulunamamıştır</p>}
            </div>
        </div>
    )
}

Schedule.getLayout = function getLayout(Schedule) {

    return (
        <Layout routes={guardianRoutes}>
            {Schedule}
        </Layout>
    );
}