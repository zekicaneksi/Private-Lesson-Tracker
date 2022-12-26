import styles from './StudentList.module.css';
import PopupConfirmation from '../PopupConfirmation.js';
import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch';
import { useRouter } from 'next/router';

export default function StudentList(props) {

    const router = useRouter();

    const [confirmationPopup, setConfirmationPopup] = useState({ msg: '', show: false, yesCallback: null, noCallback: null });
    const [formValues, setFormValues] = useState({
        searchInput: '',
        selectedRelationId: null,
        nicknameInput: '',
        personalNoteInput: ''
    });

    function changeFormValue(key, value) {
        setFormValues((old) => {
            let newVal = { ...old };
            newVal[key] = value;
            return newVal;
        })
    }

    function getSelectedRelation() {
        let toReturn;
        props.studentList.forEach(elem => {
            if (elem.relation_id == props.selectedRelationId) toReturn = elem;
        });
        return toReturn;
    }

    function sendMsgBtnHandle(type) {

        function getFullName(user) {
            return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
        }

        let label;
        let typeInfo = {};

        let selectedUser = getSelectedRelation();

        if (type == 'personal') {
            label = getFullName(selectedUser);
        } else {
            label = '(Velisi) ' + getFullName(selectedUser);
        }

        typeInfo.name = type == 'personal' ? 'personal' : 'guardian';
        typeInfo.student_id = selectedUser.user_id;

        router.push({
            pathname: '/' + props.type + '/messages',
            query: {
                label: label,
                typeInfo_name: typeInfo.name,
                typeInfo_student_id: typeInfo.student_id
            }
        }, '/' + props.type + '/messages');
    }

    function editBtnHandle() {
        props.setLoading(true);
        let personal_note_id = getSelectedRelation().personal_note_id;

        backendFetchPOST('/editPersonalNote', {
            nickname: formValues.nicknameInput,
            content: formValues.personalNoteInput,
            personal_note_id: personal_note_id
        }, async (response) => {
            if (response.status == 200) {
                props.setStudentList((old) => {
                    let newValues = [...old];
                    newValues.forEach((elem, index) => {
                        if (elem.relation_id == props.selectedRelationId) {
                            newValues[index].nickname = formValues.nicknameInput;
                            newValues[index].content = formValues.personalNoteInput;
                        }
                    });
                    return newValues;
                })
                props.setLoading(false);
            }
        });
    }

    function deleteRelationBtnHandle() {

        function deleteRelation() {
            props.setLoading(true);
            let selectedRelationId = props.selectedRelationId;
            backendFetchPOST('/deleteRelation', { relation_id: selectedRelationId }, async (response) => {
                if (response.status == 200) {
                    props.setSelectedRelationId(null);

                    props.setStudentList((old) => {
                        let newArr = [...old];
                        let holdIndex;
                        newArr.forEach((elem, index) => {
                            if (elem.relation_id == selectedRelationId) holdIndex = index;
                        });
                        newArr.splice(holdIndex, 1);
                        return newArr;
                    });

                    props.setLoading(false);
                }
            });
        }

        setConfirmationPopup({
            msg: 'İlişkiyi silmek istediğinize emin misiniz?',
            show: true,
            yesCallback: () => { deleteRelation() },
            noCallback: () => { }
        });
    }

    useEffect(() => {
        backendFetchGET('/getStudentRelations', async (response) => {
            if (response.status == 200) {
                props.setStudentList(await response.json());
            }
        });
    }, []);

    useEffect(() => {
        props.setSelectedRelationId('');
    }, [formValues.searchInput])

    useEffect(() => {
        let relation = getSelectedRelation();
        if (relation != null) {
            changeFormValue('nicknameInput', relation.nickname);
            changeFormValue('personalNoteInput', relation.content);
        }
    }, [props.selectedRelationId])

    const selectElements = props.studentList.map(elem => {
        let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        const pattern = new RegExp(formValues.searchInput, 'i');
        if (formValues.searchInput == '' || (fullName.search(pattern) != -1)) {
            return (
                <option key={elem.relation_id} value={elem.relation_id}>{fullName}</option>
            );
        }
    });

    return (
        <>
            <PopupConfirmation info={confirmationPopup} setInfo={setConfirmationPopup} />
            <div className={`fieldContainer ${styles.container}`}>
                <p>Öğrenci Listesi</p>
                <input placeholder='Ara...' onChange={(event) => { changeFormValue('searchInput', event.target.value); props.setSelectedRelationId(null) }}></input>
                <select size={5} onChange={(event) => { props.setSelectedRelationId(event.target.value) }}>
                    {selectElements}
                </select>
                <div className={`${styles.container} ${styles.maxWidth} ${props.selectedRelationId == '' ? styles.disabled : ''} ${styles.alignItems}`}>
                    <div className={styles.flexButtonContainer}>
                        <button onClick={() => { sendMsgBtnHandle('personal') }}>Mesaj Gönder</button>
                        {props.type == 'teacher' && <button onClick={() => { sendMsgBtnHandle('guardian') }}>Velisine Mesaj Gönder</button>}
                    </div>
                    <div className={styles.flexDiv}>
                        <div className={styles.fieldPair}>
                            <p>Takma Ad:</p>
                            <input value={formValues.nicknameInput} onChange={(event) => { changeFormValue('nicknameInput', event.target.value) }}></input>
                        </div>
                        <div className={styles.fieldPair}>
                            <p>Kişisel Not:</p>
                            <textarea className={styles.noteTextarea}
                                value={formValues.personalNoteInput} onChange={(event) => { changeFormValue('personalNoteInput', event.target.value) }}></textarea>
                        </div>
                    </div>
                    <button onClick={editBtnHandle}>Düzenle</button>
                    <button onClick={deleteRelationBtnHandle}>İlişkiyi Sil</button>
                </div>
            </div>
        </>
    );
}