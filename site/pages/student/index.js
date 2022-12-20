import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.js';
import { backendFetchGET } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/student/index.module.css'
import WeeklyScheduleTable from '../../components/WeeklyScheduleTable.js';

export default function Index() {

    const [scheduleWeekArr, setScheduleWeekArr] = useState([]);

    useEffect(() => {
        backendFetchGET('/getStudentSchedule', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                
                let arr = [];

                res.forEach(elem => {
                    let date = new Date(elem.date);
                    let arrDate = new Date();
                    let dateDiff = date.getDay() - 1;
                    arrDate.setDate(date.getDate() - (dateDiff > 0 ? dateDiff : (dateDiff * -6)));
                    arrDate.setHours(0,0,0,0);
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
                        startTime: elem.start_time.substring(0,5),
                        endTime: elem.end_time.substring(0,5),
                        sessionName: elem.session_name,
                        lessonName: elem.lesson_name
                    });
                });

                setScheduleWeekArr(arr);

            }
        });
    }, []);

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
            {scheduleTableElems.length > 0 ? scheduleTableElems : <p>Ders bulunamamıştır</p>}
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes = {studentRoutes}>
            {Index}
        </Layout>
    );
}