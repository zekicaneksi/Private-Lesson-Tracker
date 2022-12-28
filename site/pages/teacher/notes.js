import Layout from '../../components/Layout.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/teacher/notes.module.css';
import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions.js';

export default function Notes() {

    const [loading, setLoading] = useState(true);

    const [studentRelations, setStudentRelations] = useState([]);
    const [notesList, setNotesList] = useState([]);

    const [studentSelectedId, setStudentSelectedId] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [personalNoteTextarea, setPersonalNoteTextarea] = useState('');

    const [selectedNoteLessonId, setSelectedNoteLessonId] = useState(-1);
    const [selectedNoteId, setSelectedNoteId] = useState('');
    const [selectedNoteHeaderInput, setSelectedNoteHeaderInput] = useState('');
    const [selectedNoteContentInput, setSelectedNoteContentInput] = useState('');

    const [createNoteContentInput, setCreateNoteContentInput] = useState('');
    const [createNoteHeaderInput, setCreateNoteHeaderInput] = useState('');
    const [createNoteSelectedId, setCreateNoteSelectedId] = useState(-1);

    useEffect(() => {
        backendFetchGET('/getStudentRelations', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setStudentRelations(res);
                if (res.length > 0) setStudentSelectedId(res[0].user_id);
                setLoading(false);
            }
        });

        backendFetchGET('/getTeacherNotes', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                res.forEach((elem, index) => {
                    if (res[index].lesson_id == null) res[index].lesson_id = -1
                });
                setNotesList(res);
            }
        })
    }, [])

    useEffect(() => {
        if (studentSelectedId == '') return;
        setPersonalNoteTextarea(studentRelations.find(elem => elem.user_id == studentSelectedId).content);
        setSelectedNoteId('');
        setSelectedNoteContentInput('');
        setSelectedNoteHeaderInput('');
        setCreateNoteSelectedId(-1);
        setSelectedNoteLessonId(-1);
    }, [studentSelectedId]);

    useEffect(() => {
        if(selectedNoteId == '') return;
        let note = notesList.find(note => note.note_id == selectedNoteId);
        setSelectedNoteHeaderInput(note.header);
        setSelectedNoteContentInput(note.content);
    }, [selectedNoteId])

    useEffect(() => {
        if(studentRelations.length <= 0) return;
        if(studentRelations[0].lessonList != undefined) return;
        backendFetchPOST('/getTeacherStudentLesson', {
            userIds: studentRelations.map(student => student.user_id)
        }, async (response) => {
            let res = await response.json();
            setStudentRelations(old => {
                let toReturn = JSON.parse(JSON.stringify(old));
                toReturn.forEach((student, index) => {
                    toReturn[index].lessonList = [];
                });
                res.forEach(studentLesson => {
                    let studentIndex = toReturn.findIndex(student => student.user_id == studentLesson.student_id);
                    toReturn[studentIndex].lessonList.push(studentLesson);
                })
                return toReturn;
            })
        });
    }, [studentRelations]);

    function createNoteBtnHandle() {

        setLoading(true);
    
        backendFetchPOST('/createNote', {
            student_id: studentSelectedId,
            header: createNoteHeaderInput,
            content: createNoteContentInput,
            lesson_id: (createNoteSelectedId == -1 ? null : createNoteSelectedId)
        }, async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setNotesList((old) => {
                    let toReturn = [...old];
                    toReturn.unshift({
                        content: createNoteContentInput,
                        header: createNoteHeaderInput,
                        student_id: studentSelectedId,
                        lesson_id: createNoteSelectedId,
                        lesson_name: (createNoteSelectedId == -1 ? '' : studentRelations.find(student => student.user_id == studentSelectedId).lessonList.find(lesson => lesson.lesson_id == createNoteSelectedId).name),
                        note_id: res.insertId,
                        creation_date: new Date()
                    });
                    return toReturn;
                });

                setCreateNoteContentInput('');
                setCreateNoteHeaderInput('');
                setLoading(false);
            }
        })
    }

    function savePersonalNoteBtnHandle() {

        setLoading(true);

        let usr = studentRelations.find(elem => elem.user_id == studentSelectedId);

        backendFetchPOST('/editPersonalNote', {
            nickname: usr.nickname,
            content: personalNoteTextarea,
            personal_note_id: usr.personal_note_id
        }, async (response) => {
            if (response.status == 200) {
                setStudentRelations(old => {
                    let toReturn = [...old];
                    let index = toReturn.findIndex(elem => elem.user_id == studentSelectedId);
                    toReturn[index].content = personalNoteTextarea;
                    return toReturn;
                })

                setLoading(false);
            }
        });
    }

    function editNoteBtnHandle(){
        setLoading(true);
        backendFetchPOST('/editNote', {
            header: selectedNoteHeaderInput,
            content: selectedNoteContentInput,
            note_id: selectedNoteId
        }, async (response) => {
            if (response.status == 200){

                setNotesList(old => {
                    let toReturn = [...old];
                    let index = toReturn.findIndex(note => note.note_id == selectedNoteId);
                    toReturn[index].content = selectedNoteContentInput;
                    toReturn[index].header = selectedNoteHeaderInput;
                    return toReturn;
                });

                setLoading(false);
            }
        })
    }

    function deleteNoteBtnHandle(){
        setLoading(true);

        backendFetchPOST('/deleteNote', {
            note_id: selectedNoteId
        }, async (response) => {
            if (response.status == 200){
                setNotesList(old => old.filter(note => note.note_id != selectedNoteId));
                setSelectedNoteId('');
                setSelectedNoteContentInput('');
                setSelectedNoteHeaderInput('');
                setLoading(false);                
            }
        })
    }

    const studentListElems = studentRelations.map(student => {
        let text = student.name + ' ' + student.surname + ' ' + (student.nickname != '' ? ('(' + student.nickname + ')') : '');
        const pattern = new RegExp(searchInput, 'i');
        if (searchInput == '' || (text.search(pattern) != -1)) {
            return (
                <option key={student.user_id} value={student.user_id}>{text}</option>
            );
        }
    });

    let noteElems = []; 
    notesList.forEach(note => {
        if (note.student_id != studentSelectedId || note.lesson_id != selectedNoteLessonId) return;
        let optionText = dateToString(new Date(note.creation_date)) + ' - ' + note.header;
        noteElems.push(
            <option key={note.note_id} value={note.note_id}>{optionText}</option>
        );
    })

    let commonLessonElem = <option key={-1} value={-1}>Genel</option>;
    let studentIndex = studentRelations.findIndex(user => user.user_id == studentSelectedId);

    let noteLessonElems = [
        commonLessonElem
    ];

    notesList.forEach(note => {
        if (noteLessonElems.findIndex(elem => elem.props.value == note.lesson_id) != -1
        || note.student_id != studentSelectedId) return;
        noteLessonElems.push(
            <option key={note.lesson_id} value={note.lesson_id}>{"("+note.lesson_id+") "+note.lesson_name}</option>
        )
    })

    let givenLessonsElems = [
        commonLessonElem
    ];
    
    if(studentRelations[studentIndex]?.lessonList != undefined) {
        studentRelations[studentIndex].lessonList.forEach(studentLesson => {
            let optionText = "("+ studentLesson.lesson_id + ") " + studentLesson.name;
            givenLessonsElems.push(
                <option key={studentLesson.lesson_id} value={studentLesson.lesson_id}>{optionText}</option>
            ) ;
        })
    }

    return (
        <div className={`${styles.pageContainer} ${loading ? 'disabled' : ''}`}>

            <div className={`${styles.sideContainer} fieldContainer globalFieldContainerPadding`}>
                <p>Öğrenciler</p>
                <input placeholder='Ara...' onChange={(event) => setSearchInput(event.target.value)}></input>
                <select size={5} className={styles.flexOne}
                    value={studentSelectedId}
                    onChange={(event) => { setStudentSelectedId(event.target.value) }}>
                    {studentListElems}
                </select>
                <p>Kişisel Not</p>
                <textarea value={personalNoteTextarea}
                    onChange={(event) => { setPersonalNoteTextarea(event.target.value) }}
                    className={`${studentSelectedId == '' ? 'disabled' : ''}`}></textarea>
                <button onClick={savePersonalNoteBtnHandle}
                    className={`${studentSelectedId == '' ? 'disabled' : ''}`}>Kaydet</button>
            </div>

            <div className={styles.sideContainer}>
                <div className={`fieldContainer ${styles.flex} ${styles.flexGap}`}>
                    <p>Öğrenciye Dair Notlar</p>
                    <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                        <select value={selectedNoteLessonId} onChange={(event) => {setSelectedNoteLessonId(event.target.value)}}>
                            {noteLessonElems}
                        </select>
                        <select size={5} className={styles.flexOne}
                        onChange={(event) => {setSelectedNoteId(event.target.value)}}>
                            {noteElems}
                        </select>
                        <button className={`${selectedNoteId == '' ? 'disabled' : ''}`}
                        onClick={deleteNoteBtnHandle}>Sil</button>
                    </div>
                    <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                        <select className={styles.hidden}></select>
                        <input value={selectedNoteHeaderInput}
                        onChange={(event) => {setSelectedNoteHeaderInput(event.target.value)}}></input>
                        <textarea value={selectedNoteContentInput}
                        onChange={(event) => {setSelectedNoteContentInput(event.target.value)}}></textarea>
                        <button className={`${selectedNoteId == '' ? 'disabled' : ''}`}
                        onClick={editNoteBtnHandle}>Düzenle</button>
                    </div>
                </div>
                <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} ${styles.flexGap} ${studentRelations[0]?.lessonList != undefined ? '' : 'loading'}`}>
                    <p>Not Oluştur</p>
                    <textarea placeholder='İçerik...' value={createNoteContentInput}
                        onChange={(event) => { setCreateNoteContentInput(event.target.value) }}></textarea>
                    <p>Başlık</p>
                    <input placeholder='Başlık' value={createNoteHeaderInput}
                        onChange={(event) => { setCreateNoteHeaderInput(event.target.value) }}></input>
                    <p>İlişkili Ders</p>
                    <select value={createNoteSelectedId} onChange={(event) => {setCreateNoteSelectedId(event.target.value)}}>
                        {givenLessonsElems}
                    </select>
                    <button onClick={createNoteBtnHandle}>Oluştur</button>
                </div>

            </div>

        </div>
    )
}

Notes.getLayout = function getLayout(Notes) {

    return (
        <Layout routes={teacherRoutes}>
            {Notes}
        </Layout>
    );
}