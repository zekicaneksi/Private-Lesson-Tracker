import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../../utils/backendFetch';
import { convertTimeToMinutes, dateToString } from '../../../utils/formatConversions';
import Popup from '../../Popup';
import styles from './LessonsPage.module.css';
import { useRouter } from 'next/router'
import PopupConfirmation from '../../../components/PopupConfirmation.js';

function LessonBox(props) {

    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [lessonInfo, setLessonInfo] = useState({
        sessionList: [],
        studentList: []
    });
    const [formValues, setFormValues] = useState({
        searchInput: '',
        nameInput: '',
        dateInput: '',
        timeBeginInput: '00:00',
        timeEndInput: '00:00',
        selectedSessionId: '',
        selectedStudentId: '',
        selectedAddStudentId: ''
    });
    const [studentRelations, setStudentRelations] = useState([]);

    function changeFormValue(key, value) {
        setFormValues((old) => {
            let toReturn = { ...old };
            toReturn[key] = value;
            return toReturn;
        });
    }

    useEffect(() => {
        backendFetchGET('/getTeacherLessonInfoById?lessonId=' + props.lessonInfo.lesson_id, async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                res.sessionList.forEach((element, index) => {
                    res.sessionList[index].date = new Date(res.sessionList[index].date);
                });
                setLessonInfo({
                    sessionList: [...res.sessionList],
                    studentList: [...res.studentList]
                });
                setLoading(false);
            }
        });

        backendFetchGET('/getStudentRelations', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setStudentRelations(res);
            }
        })
    }, []);

    function removeSessionBtnHandle() {
        setLoading(true);

        backendFetchPOST('/removeSession', { sessionId: formValues.selectedSessionId }, async (response) => {
            if (response.status == 200) {

                let holdSelectedSessionId = formValues.selectedSessionId;

                setLessonInfo((old) => {
                    let toReturn = { ...old };
                    toReturn.sessionList = toReturn.sessionList.filter(elem => elem.session_id != holdSelectedSessionId);
                    return toReturn;
                });

                changeFormValue("selectedSessionId", '')

                setLoading(false);
            }
        });
    }

    function addSessionBtnHandle() {

        // Value validation
        if (formValues.nameInput == "") {
            props.showPopUp("Lütfen seans adını boş bırakmayınız");
            return;
        }

        if (BigInt(convertTimeToMinutes(formValues.timeBeginInput)) > BigInt(convertTimeToMinutes(formValues.timeEndInput))) {
            props.showPopUp("Seans başlangıç tarihi, bitiş tarihinden sonra olamaz");
            return;
        }

        if (formValues.dateInput == "") {
            props.showPopUp("Başlangıç tarihi seçiniz");
            return;
        }

        if (new Date(formValues.dateInput) < new Date()) {
            props.showPopUp("Seans tarihi gelecekte olmalı");
            return;
        }

        setLoading(true);


        // Make the request
        backendFetchPOST('/addSession', {
            name: formValues.nameInput,
            date: formValues.dateInput,
            startTime: formValues.timeBeginInput,
            endTime: formValues.timeEndInput,
            lessonId: props.lessonInfo.lesson_id
        }, async (response) => {
            if (response.status == 200) {

                let insertId = (await response.json()).insertId;
                let toPush = {
                    session_id: insertId,
                    name: formValues.nameInput,
                    date: new Date(formValues.dateInput),
                    start_time: formValues.timeBeginInput,
                    end_time: formValues.timeEndInput
                };
                setLessonInfo((old) => {
                    let toReturn = { ...old };
                    toReturn.sessionList = [...toReturn.sessionList, { ...toPush }];
                    return toReturn;
                });

                changeFormValue("selectedSessionId", '');

            } else {
                props.showPopUp("Girilen değerler hatalı");
            }

            setLoading(false);
        })
    }

    function removeStudentBtnHandle() {
        setLoading(true);

        backendFetchPOST('/removeStudentFromLesson', {
            lessonId: props.lessonInfo.lesson_id,
            studentId: formValues.selectedStudentId
        }, async (response) => {
            if (response.status == 200) {

                let holdSelectedStudentId = formValues.selectedStudentId;
                let holdStudentInfo = { ...lessonInfo.studentList.find(elem => elem.student_id == holdSelectedStudentId) };
                holdStudentInfo.user_id = holdStudentInfo.student_id;
                delete holdStudentInfo.student_id;

                setLessonInfo((old) => {
                    let toReturn = { ...old };
                    toReturn.studentList = toReturn.studentList.filter(elem => elem.student_id != holdSelectedStudentId);
                    return toReturn;
                });

                props.showPopUp("Eğer gerekiyorsa, silinen öğrencinin ödemeleri, ödemeler sayfasından düzeltilmelidir");
                changeFormValue("selectedStudentId", '');
                setLoading(false);
            }
        });

    }

    function addStudentBtnHandle() {
        setLoading(true);

        backendFetchPOST('/addStudentToLesson', {
            lessonId: props.lessonInfo.lesson_id,
            studentId: formValues.selectedAddStudentId
        }, async (response) => {
            if (response.status == 200) {

                let res = await response.json().student_lesson_id;

                let holdStudentInfo = { ...studentRelations.find(elem => elem.user_id == formValues.selectedAddStudentId) };

                let toPush = {
                    name: holdStudentInfo.name,
                    surname: holdStudentInfo.surname,
                    nickname: holdStudentInfo.nickname,
                    student_id: holdStudentInfo.user_id,
                    student_lesson_id: res
                };

                setLessonInfo((old) => {
                    let toReturn = { ...old };
                    toReturn.studentList = [...toReturn.studentList, { ...toPush }];
                    return toReturn;
                })

                props.showPopUp("Eğer gerekiyorsa, eklenen öğrencinin ödemeleri, ödemeler sayfasından eklenmelidir");
                changeFormValue("selectedStudentId", '');
                changeFormValue("selectedAddStudentId", '');
                setLoading(false);
            }
        });
    }

    function sendMsgBtnHandle() {
        router.push({
            pathname: '/teacher/messages',
            query: { lessonId: props.lessonInfo.lesson_id }
        }, '/teacher/messages');
    }

    function endLessonBtnHandle(){

        function endLesson(){
            setLoading(true);
            backendFetchPOST('/endLesson', {lessonId: props.lessonInfo.lesson_id}, async (response) => {
                if (response.status == 200){

                    props.setLessonList((old) => {
                        let toReturn = [...old];
                        return toReturn.filter(elem => elem.lesson_id != props.lessonInfo.lesson_id)
                    });

                    setLoading(false);
                }
            });
        }

        props.setConfirmationPopup({
            msg: 'Dersi sonlandırmak istediğinize emin misiniz?',
            show: true,
            yesCallback: () => { endLesson() },
            noCallback: () => { }
        });
    }

    let sortedSessionList = lessonInfo.sessionList.sort((a, b) => {
        if (a.date > b.date) return 1;
        else if (a.date < b.date) return -1;
        else {
            let time_a = BigInt(convertTimeToMinutes(a.start_time));
            let time_b = BigInt(convertTimeToMinutes(b.start_time));
            if (time_a > time_b) return 1;
            else if (time_a < time_b) return -1;
            else return 0;
        };
    });

    const sessionElems = sortedSessionList.map((elem, index) => {
        if (elem.date > new Date()) {
            let text = dateToString(elem.date) + ' ' + elem.start_time.substring(0, 5) + ' - ' + elem.end_time.substring(0, 5) + " " + elem.name;
            return <option key={elem.session_id} value={elem.session_id}>{text}</option>
        }
    });

    const filteredAddStudentElems = studentRelations.filter(elem => ((lessonInfo.studentList.findIndex(find => find.student_id == elem.user_id)) == -1));

    const addStudentElems = filteredAddStudentElems.map(elem => {
        let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        const pattern = new RegExp(formValues.searchInput, 'i');
        if (formValues.searchInput == '' || (fullName.search(pattern) != -1)) {
            return (
                <option key={elem.user_id} value={elem.user_id}>{fullName}</option>
            );
        }
    });

    if (addStudentElems.length > 0 && addStudentElems[0] != undefined && formValues.selectedAddStudentId != addStudentElems[0].props.value) changeFormValue("selectedAddStudentId", addStudentElems[0].props.value);

    const studentListElems = lessonInfo.studentList.map(elem => {
        let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        return (
            <option key={elem.student_id} value={elem.student_id}>{fullName}</option>
        );
    });

    return (
        <div className={`fieldContainer ${loading ? 'disabled' : ''} ${styles.flex} ${styles.flexRow} globalFieldContainerPadding ${styles.flexGap} ${styles.flexJustifyCenter}`}>
            <p>{props.lessonInfo.name}</p>
            <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} globalFieldContainerPadding`}>
                <p>Seanslar</p>
                <button className={`${styles.marginLeftAuto} ${formValues.selectedSessionId == '' ? 'disabled' : ''}`}
                    onClick={() => { props.setNavInfo(formValues.selectedSessionId) }}>Seans Geçmişi</button>
                <select size={5} onChange={(event) => { changeFormValue("selectedSessionId", event.target.value) }}>
                    {sessionElems}
                </select>
                <button className={`${formValues.selectedSessionId == '' ? 'disabled' : ''}`}
                    onClick={removeSessionBtnHandle}>Seans kaldır</button>
                <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap}`}>
                    <p>Ad:</p>
                    <input value={formValues.nameInput}
                        onChange={(event) => { changeFormValue("nameInput", event.target.value) }}></input>
                </div>
                <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap}`}>
                    <p>Tarih:</p>
                    <input type="date" value={formValues.dateInput}
                        onChange={(event) => { changeFormValue("dateInput", event.target.value) }}></input>
                </div>
                <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap}`}>
                    <p>Saat:</p>
                    <input type="time" value={formValues.timeBeginInput}
                        onChange={(event) => { changeFormValue("timeBeginInput", event.target.value) }}></input>
                    <p>-</p>
                    <input type="time" value={formValues.timeEndInput}
                        onChange={(event) => { changeFormValue("timeEndInput", event.target.value) }}></input>
                </div>
                <button onClick={addSessionBtnHandle}>Seans Ekle</button>
            </div>

            <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} globalFieldContainerPadding`}>
                <p>Öğrenciler</p>
                <button onClick={sendMsgBtnHandle}
                    className={`${styles.marginLeftAuto} ${studentListElems.length == 0 ? 'disabled' : ''}`}>Öğrencilere Mesaj Gönder</button>
                <select size={5} onChange={(event) => { changeFormValue("selectedStudentId", event.target.value) }}>
                    {studentListElems}
                </select>
                <button onClick={removeStudentBtnHandle}
                    className={`${formValues.selectedStudentId == '' ? 'disabled' : ''}`}>Öğrenci Sil</button>
                <div className={`${studentRelations.length == 0 ? 'disabled' : ''} ${styles.flex} ${styles.flexColumn}`}>
                    <input placeholder='Ara...' value={formValues.searchInput}
                        onChange={(event) => { changeFormValue("searchInput", event.target.value) }}></input>
                    <select value={formValues.selectedAddStudentId}
                        onChange={(event) => { changeFormValue("selectedAddStudentId", event.target.value) }}>
                        {addStudentElems}
                    </select>
                    <button onClick={addStudentBtnHandle} className={`${formValues.selectedAddStudentId == '' ? 'disabled' : ''}`}>Öğrenci Ekle</button>
                </div>
                <button onClick={endLessonBtnHandle}
                className={`${styles.endLessonBtn}`}>Dersi Sonlandır</button>
            </div>
        </div>
    );
}

export default function LessonsPage(props) {

    const [loading, setLoading] = useState(true);
    const [lessonList, setLessonList] = useState([]);
    const [popupInfo, setPopupInfo] = useState({ msg: "", show: false });
    const [confirmationPopup, setConfirmationPopup] = useState({ msg: '', show: false, yesCallback: null, noCallback: null });

    function showPopup(msg) {
        setPopupInfo({ message: msg, show: true });
    }

    useEffect(() => {
        backendFetchGET('/getTeacherLessons', async (response) => {
            if (response.status == 200) {
                setLessonList(await response.json());
                setLoading(false);
            }
        })
    }, []);

    const lessonBoxList = lessonList.map(elem => {
        if (!elem.ended) {
            return <LessonBox key={elem.lesson_id} lessonInfo={elem} setNavInfo={props.setNavInfo} showPopUp={showPopup} setConfirmationPopup={setConfirmationPopup} setLessonList={setLessonList}/>
        }
    })

    return (
        <>
            <PopupConfirmation info={confirmationPopup} setInfo={setConfirmationPopup} />
            <Popup
                message={popupInfo.message}
                show={popupInfo.show}
                setPopupInfo={setPopupInfo} />
            <div className={`${loading ? 'disabled' : ''} ${styles.pageContainer}`}>
                {lessonBoxList}
            </div>
        </>
    );
}