import styles from './PastPaymentsPage.module.css'
import { useState, useEffect } from 'react';
import { backendFetchGET } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';

export default function PastPaymentsPage(props) {

    const [filterLessonId, setFilterLessonId] = useState('all');
    const [filterStudentId, setFilterStudentId] = useState('all');

    const [paymentList, setPaymentList] = useState({});

    useEffect(() => {
        backendFetchGET('/getTeacherPayments', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                res.paymentList = res.paymentList.filter(elem => elem.paid == true);
                res.lessonList = res.lessonList.filter(lesson => res.paymentList.findIndex(payment => payment.lesson_id == lesson.lesson_id) != -1)
                setPaymentList(res);
            }
        })
    }, []);

    useEffect(() => {
        setFilterStudentId('all');
    }, [filterLessonId])

    function resetFilterBtnHandle() {
        setFilterLessonId('all');
    }

    // -- Payment Schedule DOM stuff

    let filterLessonElems = paymentList.lessonList?.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.lesson_name}</option>
    })
    filterLessonElems?.unshift(
        <option key={"all"} value={"all"}>Hepsi</option>
    );

    let filterStudentElems = [];
    paymentList.paymentList?.forEach(payment => {
        if (!(payment.lesson_id == filterLessonId) && filterLessonId != 'all') return;
        let usr = paymentList.userList.find(usr => usr.user_id == payment.student_id);
        if (filterStudentElems.findIndex(option => option.key == usr.user_id) != -1) return;
        let optionText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        filterStudentElems.push(<option key={usr.user_id} value={usr.user_id}>{optionText}</option>);
    });
    filterStudentElems?.unshift(
        <option key={"all"} value={"all"}>Hepsi</option>
    );

    const paymentScheduleElems = paymentList.paymentList?.map(payment => {
        if ((payment.lesson_id != filterLessonId && filterLessonId != 'all') ||
            (payment.student_id != filterStudentId && filterStudentId != 'all')) return;
        let usr = paymentList.userList.find(usr => usr.user_id == payment.student_id);
        let usrText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        let lesson = paymentList.lessonList.find(lesson => lesson.lesson_id == payment.lesson_id);
        let text = dateToString(new Date(payment.due)) + ' - ' + payment.amount.substring(0, payment.amount.toString().indexOf('.')) + ' TL ' + usrText + ' - ' + lesson.lesson_name
        return <option key={payment.payment_id} value={payment.payment_id}>{text}</option>
    })

    return (
        <div className={`fieldContainer ${styles.container}`}>
            <p>Ödeme Takvimi</p>
            <div className={`${styles.flex} ${styles.flexGap}`}>
                <div className={styles.fieldPair}>
                    <p>Ders:</p>
                    <select onChange={(event) => { setFilterLessonId(event.target.value) }}
                        value={filterLessonId}>
                        {filterLessonElems}
                    </select>
                </div>
                <div className={styles.fieldPair}>
                    <p>Öğrenci:</p>
                    <select onChange={(event) => { setFilterStudentId(event.target.value) }}
                        value={filterStudentId}>
                        {filterStudentElems}
                    </select>
                </div>
                <button onClick={resetFilterBtnHandle} className={styles.whiteSpaceNoWrap}>Filtreyi Temizle</button>
            </div>
            <select size={5} className={styles.minWidthFull}
                onChange={(event) => { setSelectedPaymentId(event.target.value) }}>
                {paymentScheduleElems}
            </select>
        </div>
    );
}