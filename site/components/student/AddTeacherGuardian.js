import styles from './AddTeacherGuardian.module.css';
import Image from 'next/image';
import Img_Search from './../../public/search.svg';
import { useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import Popup from '../Popup.js';

export default function AddTeacherGuardian(props) {

    const [popupInfo, setPopupInfo] = useState({ msg: "", show: false })
    const [disabled, setDisabled] = useState(true);
    const [formValues, setFormValues] = useState({
        id: '',
        name: '',
        nickname: '',
        personalNote: ''
    });

    function showPopup(msg) {
        setPopupInfo({ message: msg, show: true });
    }

    function resetFormValues(){
        setFormValues((old) => {
            let newValues = {...old};
            Object.keys(newValues).forEach(key => {
                if(key === 'id') return;
                newValues[key] = '';
            });
            return newValues;
        });
    }

    function searchTeacherId() {

        resetFormValues();
        setDisabled(true);
        backendFetchGET('/getUserById?id=' + formValues.id, async (response) => {
            if (response.status == 400) showPopup('Geçersiz ID Girişi');
            else if (response.status == 404) showPopup('Kullanıcı Bulunamadı');
            else {
                let res = await response.json();
                if (res.user_type != props.type) showPopup("ID'si verilen kullanıcı "+ (props.type == 'teacher' ? 'öğretmen' : 'veli') +" değil");
                else {
                    setFormValues((old) => {
                        let newValues = { ...old };
                        newValues.name = res.name + ' ' + res.surname;
                        return newValues;
                    });
                    setDisabled(false);
                }
            }
        });
    }

    function inputOnChange(newValue, formKey) {
        setFormValues((old) => {
            let oldValues = { ...old };
            oldValues[formKey] = newValue.target.value;
            return oldValues;
        });
    }

    function addButtonHandle(){
        setDisabled(true);
        backendFetchPOST('/createRelationRequest', {
            user_id: formValues.id,
            nickname: formValues.nickname,
            personalNote: formValues.personalNote
        }, async (response) => {
            if(response.status == 200){
                let addedRequest = await response.json();
                props.setSentRequests((old) => {
                   let newArr = [...old];
                   newArr.push(addedRequest); 
                   return newArr;
                });
                showPopup("İstek Gönderildi");
            } else {
                showPopup("Daha önce istek gönderildi");
            }
            setDisabled(false);
        });
    }

    return (
        <>
            <Popup
                message={popupInfo.message}
                show={popupInfo.show}
                setPopupInfo={setPopupInfo} />
            <div className={`fieldContainer ${styles.addTeacherGuardianField}`}>
                <p>{props.type == "teacher" ? 'Öğretmen' : 'Veli'} Ekle</p>
                <div className={styles.fieldPair}>
                    <p>ID:</p>
                    <div className={styles.idInputContainer}>
                        <input onChange={(newValue) => { setDisabled(true); inputOnChange(newValue, 'id'); }}
                            value={formValues.id}></input>
                        <Image
                            src={Img_Search}
                            alt="Search button"
                            onClick={searchTeacherId} />
                    </div>
                </div>
                <div className={`${styles.loadingDiv} ${(disabled ? styles.disabled : '')}`}>
                    <div className={styles.fieldPair}>
                        <p>Ad:</p>
                        <input readOnly={true} className={styles.readOnlyInput}
                            value={formValues.name}></input>
                    </div>
                    <div className={styles.fieldPair}>
                        <p>Takma Ad:</p>
                        <input onChange={(newValue) => { inputOnChange(newValue, 'nickname') }}
                            value={formValues.nickname}></input>
                    </div>
                    <div className={styles.fieldPair}>
                        <p>Kişisel Not:</p>
                        <textarea className={styles.noteTextarea}
                            onChange={(newValue) => { inputOnChange(newValue, 'personalNote') }}
                            value={formValues.personalNote}></textarea>
                    </div>
                    <button onClick={addButtonHandle}>Ekle</button>
                </div>

            </div>
        </>
    );
}