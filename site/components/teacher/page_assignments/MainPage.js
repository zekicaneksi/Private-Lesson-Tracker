import styles from './MainPage.module.css';
import TransferBox from '../../TransferBox.js'
import { Fragment, useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../../utils/backendFetch';
import { dateToString } from '../../../utils/formatConversions.js'

function EnterAssignment(props) {

    const [selectedLessonId, setSelectedLessonId] = useState(-1);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(-1);
    const [assignmentContentInput, setAssignmentContentInput] = useState('');

    const [studentList, setStudentList] = useState([]);


    useEffect(() => {
        if (props.givenAssignments.lessonList?.length > 0) setSelectedLessonId(props.givenAssignments.lessonList[0].lesson_id);
    }, [props.givenAssignments])

    useEffect(() => {
        if (props.givenAssignments.lessonList?.length > 0 && selectedAssignmentId != -1) {
            setStudentList(() => {
                let index = props.givenAssignments.lessonList.findIndex(elem => elem.lesson_id == selectedLessonId);
                return props.givenAssignments.lessonList[index].studentsTakingTheLesson.map(elem => {
                    let usr = props.givenAssignments.uniqueUsers.find(usr => usr.user_id == elem);
                    usr.side = "left";
                    usr.optionText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
                    return usr;
                })
            })
            setSelectedAssignmentId(-1);
            setAssignmentContentInput('');
        }
    }, [selectedLessonId]);

    useEffect(() => {
        if (props.givenAssignments.lessonList?.length > 0 && selectedAssignmentId != -1) {
            let lessonIndex = props.givenAssignments.lessonList.findIndex(elem => elem.lesson_id == selectedLessonId);
            let assignment = props.givenAssignments.lessonList[lessonIndex].assignmentList.find(assignment => assignment.assignment_id == selectedAssignmentId);
            setAssignmentContentInput(assignment.content);
        }
    }, [selectedAssignmentId])

    function transferAllBtnHandle() {
        setStudentList(old => {
            return old.map(elem => { elem.side = "right"; return elem; });
        });
    }

    function saveBtnHandle() {

        props.setLoading(true);

        backendFetchPOST('/registerAssignment', {
            assignment_id: selectedAssignmentId,
            studentList: studentList.map(student => {
                let toReturn = {};
                toReturn.student_id = student.user_id;
                toReturn.done = (student.side == "left" ? false : true);
                return toReturn;
            })
        }, async (response) => {
            if (response.status == 200) {
                props.setGivenAssignments(old => {
                    let toReturn = JSON.parse(JSON.stringify(old));
                    let lessonIndex = toReturn.lessonList.findIndex(lesson => lesson.lesson_id == selectedLessonId);
                    toReturn.lessonList[lessonIndex].assignmentList.splice(toReturn.lessonList[lessonIndex].assignmentList.findIndex(assignment => assignment.assignment_id == selectedAssignmentId),1);
                    return toReturn;
                })

                props.setLoading(false);
                props.showPopup("Giriş kaydedildi");
            }
        })
    }

    const lessonSelectElems = props.givenAssignments.lessonList?.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.lesson_name}</option>
    });

    let assignmentsSelectElems = [];
    let lessonIndex = props.givenAssignments.lessonList?.findIndex(elem => elem.lesson_id == selectedLessonId)
    if (props.givenAssignments.lessonList != undefined && lessonIndex != -1) {
        props.givenAssignments.lessonList[lessonIndex].assignmentList.forEach(assignment => {
            let optionText = assignment.header + ' - ' + dateToString(new Date(assignment.due))
            assignmentsSelectElems.push(<option key={assignment.assignment_id} value={assignment.assignment_id}>{optionText}</option>);
        })
    }

    return (
        <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
            <p>Ödev Girişi</p>
            <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap} ${styles.flexJustifyCenter}`}>
                <p>Ders:</p>
                <select onChange={(event) => { setSelectedLessonId(event.target.value) }}>
                    {lessonSelectElems}
                </select>
            </div>
            <select size={5} onChange={(event) => { setSelectedAssignmentId(event.target.value) }}>
                {assignmentsSelectElems}
            </select>
            <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${selectedAssignmentId == -1 ? 'disabled' : ''}`}>
                <textarea readOnly={true} className={`${styles.textarea}`} value={assignmentContentInput}></textarea>
                <TransferBox
                    leftSideLabel="Ödevi Alan Öğrenciler"
                    rightSideLabel="Ödevi Teslim Eden Öğrenciler"
                    elemArray={studentList}
                    setElemArray={setStudentList} />
                <button className={styles.marginRightAuto} onClick={transferAllBtnHandle}>Tümünü Aktar</button>
                <button onClick={saveBtnHandle}>Kaydet</button>
            </div>
        </div>
    );
}

function GiveAssignment(props) {

    const [lessonList, setLessonList] = useState([]);
    const [selectedSelectValue, setSelectedSelectValue] = useState(-1);

    const [loading, setLoading] = useState(true);

    const [headerInput, setHeaderInput] = useState('');
    const [contentInput, setContentInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    useEffect(() => {
        if (selectedSelectValue != -1) {
            setHeaderInput('');
            setContentInput('');
            setDateInput('');
        }
    }, [selectedSelectValue]);

    useEffect(() => {

        backendFetchGET('/getTeacherLessons', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                let filtered = res.filter(elem => elem.ended == 0);
                setLessonList([...filtered]);
                if (filtered.length > 0) setSelectedSelectValue(filtered[0].lesson_id);
                setLoading(false);
            }
        });

    }, []);

    function createBtnHandle() {

        props.setLoading(true);

        if (headerInput == '' || contentInput == '' || dateInput == '') props.showPopup('Lütfen boş alan bırakmayınız');
        if (new Date(dateInput) < new Date()) props.showPopup('Lütfen gelecek tarihten bir zaman giriniz');

        backendFetchPOST('/createAssignment', {
            lesson_id: selectedSelectValue,
            header: headerInput,
            content: contentInput,
            due: dateInput
        }, async (response) => {
            if (response.status == 200) {

                let insertId = (await response.json()).insertId;

                props.setGivenAssignments(old => {
                    let toReturn = JSON.parse(JSON.stringify(old));
                    let lessonIndex = toReturn.lessonList.findIndex(elem => elem.lesson_id == selectedSelectValue);
                    toReturn.lessonList[lessonIndex].assignmentList.unshift({
                        assignment_id: insertId,
                        content: contentInput,
                        due: dateInput,
                        header: headerInput,
                        lesson_id: selectedSelectValue
                    });
                    return toReturn;
                });

                setSelectedSelectValue(lessonList[0].lesson_id);
                setHeaderInput('');
                setContentInput('');
                setDateInput('');
                props.setLoading(false);
                props.showPopup('Ödev oluşturuldu');
            }
        })
    }

    const selectElems = lessonList.map(lesson => {
        return <option key={lesson.lesson_id} value={lesson.lesson_id}>{lesson.name}</option>
    })

    return (
        <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${(loading ? 'disabled' : '')}`}>
            <p>Ödev Ver</p>
            <div className={`${styles.flex} ${styles.flexRow} ${styles.flexGap} ${styles.flexJustifyCenter}`}>
                <p>Ders:</p>
                <select onChange={(event) => { setSelectedSelectValue(event.target.value) }}>
                    {selectElems}
                </select>
            </div>
            <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${selectedSelectValue == -1 ? 'disabled' : ''}`}>
                <p>Ödev Başlığı</p>
                <input value={headerInput} onChange={(event) => { setHeaderInput(event.target.value) }}></input>
                <p>Ödev İçeriği</p>
                <textarea className={styles.textarea}
                    value={contentInput} onChange={(event) => { setContentInput(event.target.value) }}></textarea>
                <p>Son Teslim Tarihi</p>
                <input type={"date"}
                    value={dateInput} onChange={(event) => { setDateInput(event.target.value) }}></input>
                <button onClick={createBtnHandle}>Oluştur</button>
            </div>
        </div>
    );
}

export default function MainPage(props) {

    function showPopup(msg) {
        props.setPopupInfo({ message: msg, show: true });
    }

    return (
        <div className={`${styles.pageContainer}`}>

            <div className={styles.sideContainer}>
                <GiveAssignment setLoading={props.setLoading} showPopup={showPopup} setGivenAssignments={props.setGivenAssignments} />
            </div>

            <div className={styles.sideContainer}>
                <EnterAssignment showPopup={showPopup} givenAssignments={props.givenAssignments} setGivenAssignments={props.setGivenAssignments} setLoading={props.setLoading} />
            </div>

        </div>
    );
}