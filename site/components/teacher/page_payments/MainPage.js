import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions';
import styles from './MainPage.module.css';

export default function MainPage(props) {


    const [studentLesson, setStudentLesson] = useState({});
    const [paymentList, setPaymentList] = useState({});

    const [filterLessonId, setFilterLessonId] = useState('all');
    const [filterStudentId, setFilterStudentId] = useState('all');
    const [selectedPaymentId, setSelectedPaymentId] = useState('');

    const [addPaymentSelectedLessonId, setAddPaymentSelectedLessonId] = useState('');
    const [addPaymentSelectedUserId, setAddPaymentSelectedUserId] = useState('');
    const [addPaymentDateInput, setAddPaymentDateInput] = useState('');
    const [addPaymentAmount, setAddPaymentAmount] = useState(0);

    useEffect(() => {
        backendFetchGET('/getTeacherStudentLessons', async (response) => {
            if (response.status == 200){
                let res = await response.json();
                setStudentLesson(res);
                if (res.lessonList.length > 0) setAddPaymentSelectedLessonId(res.lessonList[0].lesson_id);
            }
        });

        backendFetchGET('/getTeacherPayments', async (response) => {
            if (response.status == 200){
                let res = await response.json();
                res.paymentList = res.paymentList.filter(elem => elem.paid == false);
                setPaymentList(res);
            }
        })
    }, []);

    useEffect(() => {
        if(addPaymentSelectedLessonId == '') return;
        let lessonIndex = studentLesson.lessonList.findIndex(lesson => lesson.lesson_id == addPaymentSelectedLessonId);
        if(studentLesson.lessonList[lessonIndex].studentList.length > 0) setAddPaymentSelectedUserId(studentLesson.lessonList[lessonIndex].studentList[0]);
    }, [addPaymentSelectedLessonId])

    useEffect(() => {
        if (studentLesson.lessonList != undefined && paymentList.paymentList != undefined ) props.setLoading(false);
    }, [studentLesson, paymentList])

    useEffect(() => {
        setFilterStudentId('all');
    }, [filterLessonId])

    function resetFilterBtnHandle(){
        setFilterLessonId('all');
    }

    function addPaymentBtnHandle(){

        // Validate values
        if(new Date(addPaymentDateInput) < new Date() || addPaymentDateInput == '') {
            props.showPopup("Ödeme tarihi gelecek bir tarih olmalıdır");
            return;
        }
        if(addPaymentAmount <= 0){
            props.showPopup("Lütfen pozitif bir miktar giriniz");
            return;
        }

        props.setLoading(true);

        backendFetchPOST('/addPayment', {
            lesson_id: addPaymentSelectedLessonId,
            student_id: addPaymentSelectedUserId,
            amount: addPaymentAmount,
            due: addPaymentDateInput
        }, async (response) => {
            if(response.status == 200){

                backendFetchGET('/getTeacherPayments', async (response) => {
                    if (response.status == 200){
                        let res = await response.json();
                        res.paymentList = res.paymentList.filter(elem => elem.paid == false);
                        setPaymentList(res);
                    }
                });

                props.setLoading(false);
            }
        });
        
    }

    function acceptPaymentBtnHandle(){

        props.setLoading(true);

        backendFetchPOST('/acceptPayment', {
            payment_id: selectedPaymentId
        }, async (response) => {
            if (response.status == 200){
                setPaymentList(old => {
                    let toReturn = JSON.parse(JSON.stringify({...old}));
                    toReturn.paymentList = toReturn.paymentList.filter(elem => elem.payment_id != selectedPaymentId);
                    return toReturn;
                })
                props.setLoading(false);
            }
        })
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
        if((payment.lesson_id != filterLessonId && filterLessonId != 'all') ||
         (payment.student_id != filterStudentId && filterStudentId != 'all')) return;
        let usr = paymentList.userList.find(usr => usr.user_id == payment.student_id);
        let usrText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        let lesson = paymentList.lessonList.find(lesson => lesson.lesson_id == payment.lesson_id);
        let text = dateToString(new Date(payment.due)) + ' - ' + payment.amount.substring(0,payment.amount.toString().indexOf('.')) + ' TL ' + usrText + ' - ' + lesson.lesson_name 
        return <option key={payment.payment_id} value={payment.payment_id}>{text}</option>
    })


    // -- Add Payment DOM stuff
    const addPaymentSessionElems = studentLesson.lessonList?.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.lesson_name}</option>
    });

    let addPaymentLessonIndex = studentLesson.lessonList?.findIndex(lesson => lesson.lesson_id == addPaymentSelectedLessonId);
    const addPaymentStudentElems = (addPaymentSelectedLessonId == '' ? [] : 
    studentLesson.lessonList[addPaymentLessonIndex].studentList.map(studentId => {
        let usr = studentLesson.userList.find(usr => usr.user_id == studentId);
        let optionText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        return <option key={usr.user_id} value={usr.user_id}>{optionText}</option>
    }));

    return (
        <div className={`fieldContainer ${styles.container}`}>
            <p>Ödeme Takvimi</p>
            <div className={`${styles.flex} ${styles.flexGap}`}>
                <div className={styles.fieldPair}>
                    <p>Ders:</p>
                    <select onChange={(event) => {setFilterLessonId(event.target.value)}}
                    value={filterLessonId}>
                        {filterLessonElems}
                    </select>
                </div>
                <div className={styles.fieldPair}>
                    <p>Öğrenci:</p>
                    <select onChange={(event) => {setFilterStudentId(event.target.value)}}
                    value={filterStudentId}>
                        {filterStudentElems}
                    </select>
                </div>
                <button onClick={resetFilterBtnHandle}>Filtreyi Temizle</button>
            </div>
            <select size={5} className={styles.minWidthFull}
            onChange={(event) => {setSelectedPaymentId(event.target.value)}}>
                {paymentScheduleElems}
            </select>
            <button className={`${selectedPaymentId == '' ? 'disabled' : ''}`}
            onClick={acceptPaymentBtnHandle}>Ödemeyi kabul et</button>
            <div className={`fieldContainer ${styles.flex} ${styles.flexGap}`}>
                <p>Ödeme Ekle</p>
                <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                    <div className={`${styles.flex} ${styles.flexGap}`}>
                        <div className={styles.fieldPair}>
                            <p>Tarih:</p>
                            <input type="date" onChange={(event) => {setAddPaymentDateInput(event.target.value)}}/>
                        </div>
                        <div className={styles.fieldPair}>
                            <p>Miktar:</p>
                            <input type="number" min={0} onChange={(event) => {setAddPaymentAmount(event.target.value)}}/>
                        </div>
                        <p>TL</p>
                    </div>
                    <div className={`${styles.flex} ${styles.flexGap}`}>
                        <div className={styles.fieldPair}>
                            <p>Ders:</p>
                            <select onChange={(event) => {setAddPaymentSelectedLessonId(event.target.value)}}>
                                {addPaymentSessionElems}
                            </select>
                        </div>
                        <div className={styles.fieldPair}>
                            <p>Öğrenci:</p>
                            <select onChange={(event) => {setAddPaymentSelectedUserId(event.target.value)}}>
                                {addPaymentStudentElems}
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={addPaymentBtnHandle}>Ödeme Ekle</button>
            </div>
        </div>
    );
}