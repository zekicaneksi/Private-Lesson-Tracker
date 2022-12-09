import styles from './AddLessonPage.module.css';
import WeeklyScheduleTable from '../../WeeklyScheduleTable';
import TransferBox from '../../TransferBox';
import { useState, useEffect } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../../utils/backendFetch.js';
import Popup from '../../../components/Popup.js';
import { dateToString, convertTimeToMinutes } from '../../../utils/formatConversions';

function Students(props) {

    return (
        <div className={`fieldContainer ${styles.studentsContainer} ${styles.flexColumn} ${styles.formCss}`}>
            <p>Öğrenciler</p>
            <TransferBox
                leftSideLabel="Öğrenciler"
                rightSideLabel="Dersi Alacak Öğrenciler"
                elemArray={props.studentList}
                setElemArray={props.setStudentList} />
        </div>
    )
}

function PaymentSchedule(props) {

    const [formValues, setFormValues] = useState({
        selectedOptionIndex: null,
        date: "",
        amount: 0
    });

    function changeFormValue(key, value) {
        setFormValues((old) => {
            let toReturn = { ...old };
            toReturn[key] = value;
            return toReturn;
        });
    }

    let sortedPaymentList = props.paymentList.sort((a, b) => {
        if (a.date > b.date) return 1;
        else if (a.date < b.date) return -1;
        else return 0;
    });
    let selectElems = sortedPaymentList.map((elem, index) => {
        let text = dateToString(elem.date) + ' ' + elem.amount + ' TL ';
        return <option key={index} value={index}>{text}</option>
    });

    function addPaymentBtnHandle() {

        // Validate values
        if (formValues.amount <= 0) {
            props.showPopUp("Miktar 0'dan büyük olmalı");
            return;
        }

        if (formValues.date == "") {
            props.showPopUp("Lütfen tarih seçiniz");
            return;
        }

        // Add the payment
        let toPush = {
            date: new Date(formValues.date),
            amount: formValues.amount
        };

        props.setPaymentList(old => {
            let toReturn = [...old];
            toReturn.push({ ...toPush });
            return toReturn;
        });

        changeFormValue("selectedOptionIndex", (props.paymentList.length > 0 ? 0 : null));
    }

    function removePaymentBtnHandle() {

        props.setPaymentList((old) => {
            let toReturn = [...old];
            toReturn.splice(formValues.selectedOptionIndex, 1);
            return toReturn;
        })

        changeFormValue("selectedOptionIndex", (props.paymentList.length > 0 ? 0 : null));
    }

    return (
        <div className={`fieldContainer ${styles.paymentScheduleContainer}`}>
            <p>Ödeme Takvimi</p>
            <select size={5} onChange={(event) => changeFormValue("selectedOptionIndex", event.target.value)}>
                {selectElems}
            </select>
            <div className={`${styles.flexRow} ${styles.formCss}`}>
                <div className={styles.flexColumn}>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Tarih</p>
                        <input type="date" onChange={(event) => { changeFormValue("date", event.target.value) }}
                            value={formValues.date} />
                    </div>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Miktar:</p>
                        <input type="number" min={0} onChange={(event) => { changeFormValue("amount", event.target.value) }}
                            value={formValues.amount} />
                        <p>TL</p>
                    </div>
                </div>
                <div className={`${styles.flexColumn} ${styles.formCss}`}>
                    <button onClick={addPaymentBtnHandle}>Ödeme Ekle</button>
                    <button onClick={removePaymentBtnHandle}
                        className={`${(formValues.selectedOptionIndex == null ? styles.disabled : '')}`}>Ödeme Kaldır</button>
                </div>
            </div>
        </div>
    );
}

function SessionSchedule(props) {

    const [formValues, setFormValues] = useState({
        selectedOptionIndex: null,
        sessionName: "",
        date: "",
        beginningTime: "00:00",
        endingTime: "00:00"
    });

    function changeFormValue(key, value) {
        setFormValues(old => {
            let toReturn = { ...old };
            toReturn[key] = value;
            return toReturn;
        });
    }

    function addSessionBtnHandle() {

        // Value validation
        if (formValues.sessionName == "") {
            props.showPopUp("Lütfen seans adını boş bırakmayınız");
            return;
        }

        if (BigInt(convertTimeToMinutes(formValues.beginningTime)) > BigInt(convertTimeToMinutes(formValues.endingTime))) {
            props.showPopUp("Seans başlangıç tarihi, bitiş tarihinden sonra olamaz");
            return;
        }

        if (formValues.date == "") {
            props.showPopUp("Başlangıç tarihi seçiniz");
            return;
        }

        // Add the session
        let toPush = {
            date: new Date(formValues.date),
            startTime: formValues.beginningTime,
            endTime: formValues.endingTime,
            sessionName: formValues.sessionName
        }

        props.setSessionList((old) => {
            let toReturn = [...old];
            toReturn.push({ ...toPush });
            return toReturn;
        });

        changeFormValue("selectedOptionIndex", (props.sessionList.length > 0 ? 0 : null));
    }

    function removeSessionBtnHandle() {
        props.setSessionList(old => {
            let toReturn = [...old];
            toReturn.splice(formValues.selectedOptionIndex, 1);
            return toReturn;
        });
        changeFormValue("selectedOptionIndex", (props.sessionList.length > 0 ? 0 : null));
    }

    let sortedSessionList = props.sessionList.sort((a, b) => {
        if (a.date > b.date) return 1;
        else if (a.date < b.date) return -1;
        else {
            let time_a = BigInt(convertTimeToMinutes(a.startTime));
            let time_b = BigInt(convertTimeToMinutes(b.startTime));
            if (time_a > time_b) return 1;
            else if (time_a < time_b) return -1;
            else return 0;
        };
    });

    let selectElems = sortedSessionList.map((elem, index) => {
        let text = dateToString(elem.date) + ' ' + elem.startTime + ' - ' + elem.endTime + " " + elem.sessionName;
        return <option key={index} value={index}>{text}</option>
    });

    return (
        <div className={`fieldContainer ${styles.sessionScheduleContainer}`}>
            <p>Seans Takvimi</p>
            <select size={5} onChange={(event) => { changeFormValue("selectedOptionIndex", event.target.value) }}>
                {selectElems}
            </select>
            <div className={`${styles.flexRow} ${styles.formCss}`}>
                <div className={styles.flexColumn}>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Ad:</p>
                        <input onChange={(event) => { changeFormValue("sessionName", event.target.value) }}
                            value={formValues.sessionName} />
                    </div>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Tarih</p>
                        <input type="date" onChange={(event) => { changeFormValue("date", event.target.value) }}
                            value={formValues.date} />
                    </div>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Saat:</p>
                        <input type="time" onChange={(event) => { changeFormValue("beginningTime", event.target.value) }}
                            value={formValues.beginningTime} />
                        <p> - </p>
                        <input type="time" onChange={(event) => { changeFormValue("endingTime", event.target.value) }}
                            value={formValues.endingTime} />
                    </div>
                </div>
                <div className={`${styles.flexColumn} ${styles.formCss} `}>
                    <button onClick={addSessionBtnHandle}>Seans Ekle</button>
                    <button onClick={removeSessionBtnHandle} className={`${formValues.selectedOptionIndex == null ? styles.disabled : ''}`}>Seans Kaldır</button>
                </div>
            </div>
        </div>
    );
}

function TemplateWeek(props) {

    const [formValues, setFormValues] = useState({
        selectedDay: 0,
        beginningTime: "00:00",
        endingTime: "00:00",
        sessionName: "",
        paymentType: "perSession",
        paymentAmount: 0,
        beginningDate: "",
        repetitionAmount: 0
    });
    const [scheduleList, setScheduleList] = useState({
        "0": [],
        "1": [],
        "2": [],
        "3": [],
        "4": [],
        "5": [],
        "6": []
    });

    function changeFormValue(key, value) {
        setFormValues(old => {
            let toReturn = { ...old };
            toReturn[key] = value;
            return toReturn;
        });
    }

    function addSessionBtnHandle() {

        // Validate values

        if (formValues.sessionName == "") {
            props.showPopUp("Lütfen seans adını boş bırakmayınız");
            return;
        }

        if (BigInt(convertTimeToMinutes(formValues.beginningTime)) > BigInt(convertTimeToMinutes(formValues.endingTime))) {
            props.showPopUp("Seans başlangıç tarihi, bitiş tarihinden sonra olamaz");
            return;
        }

        // Add the session to the table

        let toPush = {
            day: formValues.selectedDay,
            startTime: formValues.beginningTime,
            endTime: formValues.endingTime,
            sessionName: formValues.sessionName
        };
        setScheduleList(old => {
            let toReturn = JSON.parse(JSON.stringify(old));
            toReturn[formValues.selectedDay].push(toPush);
            return toReturn;
        });
    }

    function addToScheduleBtnHandle() {

        // Validate values
        if (formValues.paymentAmount < 0) {
            props.showPopUp("Ödeme miktarı 0'dan küçük olamaz");
            return;
        }

        if (formValues.repetitionAmount <= 0) {
            props.showPopUp("Takvim tekrarı 0'dan büyük olmalı");
            return;
        }

        if (formValues.beginningDate == "") {
            props.showPopUp("Başlangıç tarihi seçiniz");
            return;
        }

        if ((new Date(formValues.beginningDate)).getDay() != 1) {
            props.showPopUp("Başlangıç tarihi pazartesi günü olmalı");
            return;
        }

        // Get the list of sessions
        let sessionList = [];

        let holdDate = new Date(formValues.beginningDate);
        let holdRepetition = formValues.repetitionAmount;

        for (let i = 0; i < holdRepetition; i++) {
            Object.keys(scheduleList).forEach(key => {
                scheduleList[key].forEach(elem => {
                    delete elem.day;
                    elem.date = new Date(holdDate);
                    elem.date.setDate(elem.date.getDate() + parseInt(key));
                    sessionList.push({ ...elem });
                })
            })
            holdDate.setDate(holdDate.getDate() + 7);
        }

        // Add Sessions to the Sessions Schedule
        props.setSessionList((old) => [...old, ...sessionList]);

        // Add payments Payment Schedule
        if (formValues.paymentAmount != 0) {
            if (formValues.paymentType == "perSession") {
                props.setPaymentList((old) => {
                    let toReturn = [...old];
                    sessionList.forEach(elem => {
                        toReturn.push({
                            date: elem.date,
                            amount: formValues.paymentAmount
                        });
                    });
                    return toReturn;
                })
            } else if (formValues.paymentType == "perWeek") {
                props.setPaymentList((old) => {
                    let toReturn = [...old];


                    for (let i = 0; i < formValues.repetitionAmount; i++) {
                        let tempDate = new Date(formValues.beginningDate);
                        tempDate.setDate(tempDate.getDate() + (7 * i));
                        toReturn.push({
                            date: tempDate,
                            amount: formValues.paymentAmount
                        });
                    }

                    return toReturn;
                })
            } else {

            }
        }

        resetBtnHandle();
    }

    function resetBtnHandle() {
        setScheduleList({
            "0": [],
            "1": [],
            "2": [],
            "3": [],
            "4": [],
            "5": [],
            "6": []
        });

        setFormValues({
            selectedDay: 0,
            beginningTime: "00:00",
            endingTime: "00:00",
            sessionName: "",
            paymentType: "perSession",
            paymentAmount: 0,
            beginningDate: "",
            repetitionAmount: 0
        });
    }

    return (
        <div className={`fieldContainer ${styles.templateWeekContainerDiv}`}>
            <p>Şablon Hafta</p>
            <div className={styles.templateWeekSessionDiv}>
                <p>Gün:</p>
                <select onChange={(event) => { changeFormValue("selectedDay", event.target.value) }}
                    value={formValues.selectedDay}>
                    <option value="0">Pazartesi</option>
                    <option value="1">Salı</option>
                    <option value="2">Çarşamba</option>
                    <option value="3">Perşembe</option>
                    <option value="4">Cuma</option>
                    <option value="5">Cumartesi</option>
                    <option value="6">Pazar</option>
                </select>
                <p>Saat:</p>
                <input type="time"
                    onChange={(event) => { changeFormValue("beginningTime", event.target.value) }}
                    value={formValues.beginningTime} />
                <p>-</p>
                <input type="time"
                    onChange={(event) => { changeFormValue("endingTime", event.target.value) }}
                    value={formValues.endingTime} />
                <p>Ad:</p>
                <input
                    onChange={(event) => { changeFormValue("sessionName", event.target.value) }}
                    value={formValues.sessionName} />
                <button onClick={addSessionBtnHandle}>Seans Ekle</button>
            </div>
            <div className={styles.scheduleDivContainer}>
                <WeeklyScheduleTable content={scheduleList} />
            </div>
            <div className={`${styles.flexRow} ${styles.templateWeekFormContainer}`}>
                <div className={styles.flexColumn}>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Ödeme Tipi:</p>
                        <select onChange={(event) => { changeFormValue("paymentType", event.target.value) }}
                            value={formValues.paymentType}>
                            <option value="perSession">Derslik</option>
                            <option value="perWeek">Haftalık</option>
                            <option value="perMonth">Aylık</option>
                        </select>
                        <p>Miktar:</p>
                        <input type="number" size={10} min={0}
                            onChange={(event) => { changeFormValue("paymentAmount", event.target.value) }}
                            value={formValues.paymentAmount} />
                        <p>TL</p>
                    </div>
                    <div className={`${styles.flexRow} ${styles.formCss}`}>
                        <p>Başlangıç Tarihi:</p>
                        <input type="date"
                            onChange={(event) => { changeFormValue("beginningDate", event.target.value) }}
                            value={formValues.beginningDate} />
                        <p>Takvim Tekrarı:</p>
                        <input type="number" min={0}
                            onChange={(event) => { changeFormValue("repetitionAmount", event.target.value) }}
                            value={formValues.repetitionAmount} />
                        <p>Sefer</p>
                    </div>
                </div>
                <button onClick={addToScheduleBtnHandle}>Takvime Ekle</button>
                <button onClick={resetBtnHandle}>Sıfırla</button>
            </div>

        </div>
    );
}

export default function AddLessonPage(props) {

    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState({ msg: "", show: false });

    const [lessonName, setLessonName] = useState("");
    const [studentList, setStudentList] = useState([]);
    const [sessionList, setSessionList] = useState([]);
    const [paymentList, setPaymentList] = useState([]);

    function showPopup(msg) {
        setPopupInfo({ message: msg, show: true });
    }


    useEffect(() => {
        backendFetchGET('/getStudentRelations', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                res.forEach((elem, index) => {
                    res[index].side = "left";
                    res[index].optionText = elem.name + ' ' + elem.surname + ' ' + (elem.nickname != '' ? ('(' + elem.nickname + ')') : '');
                });
                setStudentList(res);

                setLoading(false);
            }
        });
    }, []);

    function createLessonBtnHandle() {

        // Value validations
        let validationFail = false;

        if (lessonName == "") {
            showPopup("Lütfen ders adı giriniz");
            return;
        }

        if (paymentList.length > 0 && studentList.findIndex(elem => elem.side == "right") == -1){
            showPopup("Dersi alan öğrenci eklenmeden ödeme eklenemez");
            return;
        }

        sessionList.forEach(elem => {
            if ((new Date(elem.date)) <= (new Date())) {
                showPopup("Seans takviminde geçmişe dair dersler bulunmaktadır.");
                validationFail = true;
            }

        });

        if (validationFail) return;

        paymentList.forEach(elem => {
            if ((new Date(elem.date)) <= (new Date())) {
                showPopup("Ödeme takviminde geçmişe dair ödemeler bulunmaktadır.");
                validationFail = true;
            }
        });

        if (validationFail) return;

        setLoading(true);
        // Make the request
        backendFetchPOST('/createLesson', {
            lessonName: lessonName,
            studentList: studentList.filter(elem => { if (elem.side == "right") return true; else return false; }),
            sessionList: sessionList,
            paymentList: paymentList
        }, (response) => {
            if (response.status == 200) {
                props.setNavInfo("lessonsPage");
            } else if (response.status == 403) {
                showPopup("Hatalı veri girişi");
                setLoading(false);
            }
        });
    }

    return (
        <>
            <Popup
                message={popupInfo.message}
                show={popupInfo.show}
                setPopupInfo={setPopupInfo} />
            <div className={`${styles.container} ${(loading ? styles.disabled : '')}`}>
                <div className={styles.lessonNameDiv}>
                    <p>Ders Adı:</p>
                    <input onChange={(event) => { setLessonName(event.target.value) }}
                        value={lessonName}></input>
                </div>
                <TemplateWeek showPopUp={showPopup} setSessionList={setSessionList} setPaymentList={setPaymentList} />
                <div className={`${styles.flexRow}  ${styles.spaceEvenly}`}>
                    <SessionSchedule showPopUp={showPopup} sessionList={sessionList} setSessionList={setSessionList} />
                    <PaymentSchedule showPopUp={showPopup} paymentList={paymentList} setPaymentList={setPaymentList} />
                </div>
                <div className={`${styles.flexRow}  ${styles.spaceEvenly}`}>
                    <Students studentList={studentList} setStudentList={setStudentList} />
                    <button className={styles.createLessonBtn} onClick={createLessonBtnHandle}>Dersi Oluştur</button>
                </div>
            </div>
        </>
    );
}