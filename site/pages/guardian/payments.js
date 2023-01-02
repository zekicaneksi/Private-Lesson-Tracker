import Layout from '../../components/Layout.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/guardian/payments.module.css'
import { useEffect, useState } from 'react';
import { backendFetchGET } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions';

export default function Payments() {

    const [pageInfo, setPageInfo] = useState();

    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [selectedLessonId, setSelectedLessonId] = useState('all');

    useEffect(() => {
        backendFetchGET('/getGuardianPayments', async (response) => {
            if (response.status == 200) {
                setPageInfo(await response.json());
            }
        })
    }, [])

    useEffect(() => {
        if (selectedStudentId != 'all') setSelectedLessonId('all');
    }, [selectedStudentId])

    let studentElems = [];
    pageInfo?.studentList.forEach(student => {
        let optionText = student.name + ' ' + student.surname + ((student.nickname != '' && student.nickname != null) ? (' (' + student.nickname + ')') : '');
        studentElems.push(<option key={student.user_id} value={student.user_id}>{optionText}</option>);
    });

    studentElems.unshift(
        <option key={"all"} value={"all"}>Hepsi</option>
    );

    let lessonElems = [];
    if (selectedStudentId == 'all') {
        pageInfo?.lessonList.forEach(lesson => {
            lessonElems.push(
                <option key={lesson.lesson_id} value={lesson.lesson_id}>{'(' + lesson.lesson_id + ') ' + lesson.name}</option>
            );
        })
    } else {
        let lessonList = pageInfo?.studentList.find(student => student.user_id == selectedStudentId)?.lessonList;
        if (lessonList) {
            lessonList.forEach(lessonId => {
                let lesson = pageInfo.lessonList.find(lesson => lesson.lesson_id == lessonId);
                lessonElems.push(
                    <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.name}</option>
                )
            })
        }
    }

    lessonElems.unshift(
        <option key={"all"} value={"all"}>Hepsi</option>
    );

    let futurePaymentElems = [];
    let pastPaymentElems = [];

    pageInfo?.paymentList.forEach(payment => {
        if (selectedStudentId != payment.student_id && selectedStudentId != 'all') return;
        if (selectedLessonId != payment.lesson_id && selectedLessonId != 'all') return;

        let optionText = dateToString(new Date(payment.due)) + ' - ' + payment.amount.substring(0, payment.amount.toString().indexOf('.')) + ' TL'
        if (selectedLessonId == 'all') optionText = optionText.concat(' - ' + pageInfo.lessonList.find(lesson => lesson.lesson_id == payment.lesson_id).name)
        if (selectedStudentId == 'all') {
            let usr = pageInfo.studentList.find(student => student.user_id == payment.student_id);
            let usrText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
            optionText = optionText.concat(' - ' + usrText);
        }

        let toPush = <option key={payment.payment_id} value={payment.payment_id}>{optionText}</option>;
        if (payment.paid == 0) futurePaymentElems.push(toPush);
        else pastPaymentElems.push(toPush);
    })

    return (
        <div className={`${styles.pageContainer}`}>
            <div className={`${styles.displayFlex} ${styles.flexGap}`}>
                <p>Öğrenci:</p>
                <select value={selectedStudentId}
                    onChange={(event) => { setSelectedStudentId(event.target.value) }}>
                    {studentElems}
                </select>
            </div>
            <div className={`${styles.displayFlex} ${styles.flexGap}`}>
                <p>Ders:</p>
                <select value={selectedLessonId}
                    onChange={(event) => { setSelectedLessonId(event.target.value) }}>
                    {lessonElems}
                </select>
            </div>
            <div className={`fieldContainer`}>
                <p>Ödeme Takvimi</p>
                <select size={5}>
                    {futurePaymentElems}
                </select>
            </div>
            <div className={`fieldContainer`}>
                <p>Ödeme Geçmişi</p>
                <select size={5}>
                    {pastPaymentElems}
                </select>
            </div>
        </div>
    )
}

Payments.getLayout = function getLayout(Payments) {

    return (
        <Layout routes={guardianRoutes}>
            {Payments}
        </Layout>
    );
}