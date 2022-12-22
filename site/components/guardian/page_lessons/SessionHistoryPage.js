import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import styles from './SessionHistoryPage.module.css';

export default function SessionHistoryPage(props){

    const [sessionList, setSessionList] = useState([]);

    useEffect(() => {
        backendFetchGET('/getGuardianSessionHistoryById?lessonId=' + props.lessonInfo.lesson_id + '&userId=' + props.lessonInfo.userId, async (response) => {
            if (response.status == 200) {
                setSessionList(await response.json());
            }
        })
    }, [])

    const sessionListElems = sessionList.map(elem => {
        elem.date = new Date(elem.date);
        let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name + ' * Katılım ' + (elem.existent == true ? 'var' : 'YOK');
        return <option key={elem.session_id} value={elem.session_id}>{text}</option>
    });

    return (
        <div className={`${styles.container}`}>
            <h3 className={styles.lessonName}>{props.lessonInfo.lesson_name}</h3>
            <p>Öğretmen: {props.lessonInfo.teacher_name}</p>
            <p>Öğrenci: {props.lessonInfo.user_name}</p>
            <div className={`fieldContainer`}>
                <p>Geçmiş Seanslar</p>
                <div>
                    <select size={5}>
                        {(sessionListElems.length > 0 ? sessionListElems : <option>Geçmiş seans bulunmamaktadır</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}