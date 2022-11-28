import styles from './TeacherGuardianList.module.css';
import { useEffect, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch';

export default function TeacherGuardianList(props) {

    const types = [
        { type: "teacher", route: '/getTeacherRelations', label: 'Öğretmen' },
        { type: "?", route: '/?', label: 'Veli' }
    ];

    let type;

    types.forEach(element => {
        if (element.type == props.type) type = element;
    });

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

    function changeFormValue(key, value){
        setFormValues((old) => {
            let newVal = {...old};
            newVal[key] = value;
            return newVal;
        })
    }

    function selectOnChangeHandle(event){
        setFormValues((old) => {
            let selectedValue;
            
            selectValues.forEach(elem => {
                if(elem.relation_id == event.target.value) selectedValue = elem;
            });

            let newVal = {...old};
            newVal.selectedRelationId = event.target.value;
            newVal.nameInput = selectedValue.name + ' ' + selectedValue.surname;
            newVal.nicknameInput = selectedValue.nickname;
            newVal.idInput = selectedValue.user_id;
            newVal.personalNoteInput = selectedValue.content;
            return newVal;
        })
    }

    function editBtnHandle(){
        setLoading(true);
        let personal_note_id;
        formValues.selectValues.forEach(elem => {
            if(elem.relation_id == formValues.selectedRelationId) personal_note_id = elem.personal_note_id;
        })
        backendFetchPOST('/editPersonalNote', {
            nickname: formValues.nicknameInput,
            content: formValues.personalNoteInput,
            personal_note_id: personal_note_id
        }, async (response) => {
            if(response.status == 200){
                setFormValues((old) => {
                    let newValues = {...old};
                    newValues.selectValues.forEach((elem, index) => {
                        if(elem.relation_id == formValues.selectedRelationId){
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

    const selectElements = formValues.selectValues.map(elem => {
        let fullName = elem.name + ' ' + elem.surname;
        const pattern = new RegExp(formValues.searchInput, 'i');
        if(formValues.searchInput == '' || (fullName.search(pattern) != -1)){
            return <option key={elem.relation_id} value={elem.relation_id}>{fullName}</option>
        }
    })

    return (
        <div className={`fieldContainer ${styles.container} ${loading ? styles.disabled : ''}`}>
            <p>{type.label} Listesi</p>
            <input placeholder='Ara...' onChange={(event) => {changeFormValue('searchInput', event.target.value); changeFormValue('selectedRelationId', null)}}></input>
            <select size={5} onChange={selectOnChangeHandle}>
                {selectElements}
            </select>
            <div className={`${styles.container} ${formValues.selectedRelationId == null ? styles.disabled : ''}`}>
                <button>Mesaj Gönder</button>
                <div className={styles.fieldPair}>
                    <p>Ad:</p>
                    <input readOnly={true} className={styles.readOnlyInput}
                    value={formValues.nameInput}></input>
                </div>
                <div className={styles.fieldPair}>
                    <p>Takma Ad:</p>
                    <input value={formValues.nicknameInput} onChange={(event) => {changeFormValue('nicknameInput', event.target.value)}}></input>
                </div>
                <div className={styles.fieldPair}>
                    <p>ID:</p>
                    <input readOnly={true} className={styles.readOnlyInput}
                    value={formValues.idInput}></input>
                </div>
                <div className={styles.fieldPair}>
                    <p>Kişisel Not:</p>
                    <textarea className={styles.noteTextarea}
                    value={formValues.personalNoteInput} onChange={(event) => {changeFormValue('personalNoteInput', event.target.value)}}></textarea>
                </div>
                <button onClick={editBtnHandle}>Düzenle</button>
            </div>
        </div>
    );
}