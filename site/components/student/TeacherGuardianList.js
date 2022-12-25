import styles from './TeacherGuardianList.module.css';
import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch';
import PopupConfirmation from '../PopupConfirmation';
import { useRouter } from 'next/router';

export default function TeacherGuardianList(props) {

    const types = [
        { type: "teacher", route: '/getTeacherRelations', label: 'Öğretmen' },
        { type: "guardian", route: '/getGuardianRelations', label: 'Veli' }
    ];

    let type;

    types.forEach(element => {
        if (element.type == props.type) type = element;
    });

    const router = useRouter();

    const [confirmationPopup, setConfirmationPopup] = useState({ msg: '', show: false, yesCallback: null, noCallback: null });
    const [loading, setLoading] = useState(true);
    const [selectValues, setSelectValues] = useState([]);
    const [formValues, setFormValues] = useState({
        searchInput: '',
        selectedRelationId: null,
        selectValues: [],
        nameInput: '',
        nicknameInput: '',
        idInput: '',
        personalNoteInput: ''
    });

    function changeFormValue(key, value) {
        setFormValues((old) => {
            let newVal = { ...old };
            newVal[key] = value;
            return newVal;
        })
    }

    function selectOnChangeHandle(event) {
        setFormValues((old) => {
            let selectedValue;

            selectValues.forEach(elem => {
                if (elem.relation_id == event.target.value) selectedValue = elem;
            });

            let newVal = { ...old };
            newVal.selectedRelationId = event.target.value;
            newVal.nameInput = selectedValue.name + ' ' + selectedValue.surname;
            newVal.nicknameInput = selectedValue.nickname;
            newVal.idInput = selectedValue.user_id;
            newVal.personalNoteInput = selectedValue.content;
            return newVal;
        })
    }

    function getSelectedRelation() {
        let toReturn;
        formValues.selectValues.forEach(elem => {
            if (elem.relation_id == formValues.selectedRelationId) toReturn = elem;
        });
        return toReturn;
    }

    function editBtnHandle() {
        setLoading(true);
        let personal_note_id = getSelectedRelation().personal_note_id;

        backendFetchPOST('/editPersonalNote', {
            nickname: formValues.nicknameInput,
            content: formValues.personalNoteInput,
            personal_note_id: personal_note_id
        }, async (response) => {
            if (response.status == 200) {
                setFormValues((old) => {
                    let newValues = { ...old };
                    newValues.selectValues.forEach((elem, index) => {
                        if (elem.relation_id == formValues.selectedRelationId) {
                            newValues.selectValues[index].nickname = old.nicknameInput;
                            newValues.selectValues[index].content = old.personalNoteInput;
                        }
                    });
                    return newValues;
                })
                setLoading(false);
            }
        });
    }

    function deleteRelationBtnHandle() {

        function deleteRelation() {
            setLoading(true);
            let selectedRelationId = getSelectedRelation().relation_id;
            backendFetchPOST('/deleteRelation', { relation_id: selectedRelationId }, async (response) => {
                if (response.status == 200) {
                    changeFormValue('selectedRelationId', null);

                    setSelectValues((old) => {
                        let newArr = [...old];
                        let holdIndex;
                        newArr.forEach((elem, index) => {
                            if (elem.relation_id == selectedRelationId) holdIndex = index;
                        });
                        newArr.splice(holdIndex, 1);
                        return newArr;
                    });
                    setLoading(false);
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

    function sendMsgBtnHandle() {
        router.push({
            pathname: '/student/messages',
            query: { user_id: getSelectedRelation().user_id }
        }, '/student/messages');
    }
    function sendMsgBtnHandle(type){
        let user = getSelectedRelation();
        let label = user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');

        router.push({
            pathname: '/student/messages',
            query: {
                label: label,
                typeInfo_name: 'personal',
                typeInfo_id: user.user_id
            }
        }, '/student/messages');
    }

    useEffect(() => {
        backendFetchGET(type.route, async (response) => {
            if (response.status == 200) {
                let values = await response.json();
                setSelectValues(values);
                changeFormValue('selectValues', values);
                setLoading(false);
            }
        });
    }, []);

    const selectElements = selectValues.map(elem => {
        let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
        const pattern = new RegExp(formValues.searchInput, 'i');
        if (formValues.searchInput == '' || (fullName.search(pattern) != -1)) {
            return (
                <option key={elem.relation_id} value={elem.relation_id}>{fullName}</option>
            );
        }
    })

    return (
        <>
            <PopupConfirmation info={confirmationPopup} setInfo={setConfirmationPopup} />
            <div className={`fieldContainer ${styles.container} ${loading ? styles.disabled : ''}`}>
                <p>{type.label} Listesi</p>
                <input placeholder='Ara...' onChange={(event) => { changeFormValue('searchInput', event.target.value); changeFormValue('selectedRelationId', null) }}></input>
                <select size={5} onChange={selectOnChangeHandle}>
                    {selectElements}
                </select>
                <div className={`${styles.container} ${styles.maxWidth} ${formValues.selectedRelationId == null ? styles.disabled : ''} ${styles.alignItems}`}>
                    <button onClick={sendMsgBtnHandle}>Mesaj Gönder</button>
                    <div className={styles.flexDiv}>
                        <div className={styles.fieldPair}>
                            <p>Ad:</p>
                            <input readOnly={true} className={styles.readOnlyInput}
                                value={formValues.nameInput}></input>
                        </div>
                        <div className={styles.fieldPair}>
                            <p>Takma Ad:</p>
                            <input value={formValues.nicknameInput} onChange={(event) => { changeFormValue('nicknameInput', event.target.value) }}></input>
                        </div>
                        <div className={styles.fieldPair}>
                            <p>ID:</p>
                            <input readOnly={true} className={styles.readOnlyInput}
                                value={formValues.idInput}></input>
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