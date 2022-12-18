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

    const [selectedNoteId, setSelectedNoteId] = useState('');
    const [selectedNoteHeaderInput, setSelectedNoteHeaderInput] = useState('');
    const [selectedNoteContentInput, setSelectedNoteContentInput] = useState('');

    const [createNoteContentInput, setCreateNoteContentInput] = useState('');
    const [createNoteHeaderInput, setCreateNoteHeaderInput] = useState('');

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
    }, [studentSelectedId]);

    useEffect(() => {
        if(selectedNoteId == '') return;
        let note = notesList.find(note => note.note_id == selectedNoteId);
        setSelectedNoteHeaderInput(note.header);
        setSelectedNoteContentInput(note.content);
    }, [selectedNoteId])

    function createNoteBtnHandle() {

        setLoading(true);

        backendFetchPOST('/createNote', {
            student_id: studentSelectedId,
            header: createNoteHeaderInput,
            content: createNoteContentInput
        }, async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setNotesList((old) => {
                    let toReturn = [...old];
                    toReturn.unshift({
                        content: createNoteContentInput,
                        header: createNoteHeaderInput,
                        student_id: studentSelectedId,
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
        if (note.student_id != studentSelectedId) return;
        let optionText = dateToString(new Date(note.creation_date)) + ' - ' + note.header;
        noteElems.push(
            <option key={note.note_id} value={note.note_id}>{optionText}</option>
        );
    })

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
                        <select size={5} className={styles.flexOne}
                        onChange={(event) => {setSelectedNoteId(event.target.value)}}>
                            {noteElems}
                        </select>
                        <button className={`${selectedNoteId == '' ? 'disabled' : ''}`}
                        onClick={deleteNoteBtnHandle}>Sil</button>
                    </div>
                    <div className={`${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                        <input value={selectedNoteHeaderInput}
                        onChange={(event) => {setSelectedNoteHeaderInput(event.target.value)}}></input>
                        <textarea value={selectedNoteContentInput}
                        onChange={(event) => {setSelectedNoteContentInput(event.target.value)}}></textarea>
                        <button className={`${selectedNoteId == '' ? 'disabled' : ''}`}
                        onClick={editNoteBtnHandle}>Düzenle</button>
                    </div>
                </div>
                <div className={`fieldContainer ${styles.flex} ${styles.flexColumn} ${styles.flexGap}`}>
                    <p>Not Oluştur</p>
                    <textarea placeholder='İçerik...' value={createNoteContentInput}
                        onChange={(event) => { setCreateNoteContentInput(event.target.value) }}></textarea>
                    <p>Başlık</p>
                    <input placeholder='Başlık' value={createNoteHeaderInput}
                        onChange={(event) => { setCreateNoteHeaderInput(event.target.value) }}></input>
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