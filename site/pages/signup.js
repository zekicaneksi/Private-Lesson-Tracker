import Head from 'next/head'
import styles from '../styles/Signup.module.css'
import { useEffect, useState } from 'react';
import { backendFetchPOST } from '../utils/backendFetch.js';
import Popup from '../components/Popup.js';
import FormInputComponent from '../components/FormInputComponent.js';

export default function Signup() {

    const [popupInfo, setPopupInfo] = useState({msg: "", show: false})
    const [disableForm, setDisableForm] = useState(false);
    const [type, setType] = useState("teacher");
    const [formValues, setFormValues] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        passwordAgain: "",
        birthDate: "",
        school: "",
        gradeBranch: ""
    });

    useEffect(() => {
        let holdFormValues = { ...formValues };
        Object.keys(holdFormValues).forEach(key => {
            holdFormValues[key] = "";
        });

        setFormValues(holdFormValues);
    }, [type])

    function showPopup(msg){
        setPopupInfo({message: msg, show:true});
    }

    function signupBtnHandle() {

        if(formValues.password != formValues.passwordAgain){
            showPopup("Şifre eşleşmiyor");
            return;
        }

        let toSend = { ...formValues, type: type };
        setDisableForm(true);
        backendFetchPOST('/signup', toSend, async (response) => {
            if (response.status != 200) {
                switch ((await response.json()).msg) {
                    case "ER_BAD_NULL_ERROR":
                        showPopup("Lütfen boş alan bırakmayınız");
                        break;
                    case "ER_DUP_ENTRY":
                        showPopup("Lütfen kullanılmayan bir mail adresi giriniz");
                        break;
                    case "Password Too Long":
                        showPopup("Çok uzun bir şifre girdiniz");
                        break;
                    default:
                        showPopup("Lütfen alanları eksiksiz ve doğru bir biçimde doldurunuz");
                        break;
                }
            }
            setDisableForm(false);
        })
    }

    return (
        <>
            <Popup
            message = {popupInfo.message}
            show = {popupInfo.show}
            setPopupInfo = {setPopupInfo} />
            <div className={`${styles.container} ${disableForm ? styles.disable : ''}`}>
                <Head>
                    <title>Kayıt</title>
                </Head>

                <div className={styles.flexRow}>
                    <p className={styles.zeroMargin}>Tip</p>
                    <button onClick={() => setType("teacher")} className={(type === 'teacher' ? styles.halfTransparent : "")}>Öğretmen</button>
                    <button onClick={() => setType("student")} className={(type === 'student' ? styles.halfTransparent : "")}>Öğrenci</button>
                    <button onClick={() => setType("guardian")} className={(type === 'guardian' ? styles.halfTransparent : "")}>Veli</button>
                </div>

                <FormInputComponent
                    label="Ad"
                    value={formValues.name}
                    onChange={(newValue) => { setFormValues({ ...formValues, name: newValue }) }}
                    type="text"
                />

                <FormInputComponent
                    label="Soyad"
                    value={formValues.surname}
                    onChange={(newValue) => { setFormValues({ ...formValues, surname: newValue }) }}
                    type="text" />

                <FormInputComponent
                    label="Email"
                    value={formValues.email}
                    onChange={(newValue) => { setFormValues({ ...formValues, email: newValue }) }}
                    type="text" />

                <FormInputComponent
                    label="Şifre"
                    value={formValues.password}
                    onChange={(newValue) => { setFormValues({ ...formValues, password: newValue }) }}
                    type="password" />

                <FormInputComponent
                    label="Tekrar Şifre"
                    value={formValues.passwordAgain}
                    onChange={(newValue) => { setFormValues({ ...formValues, passwordAgain: newValue }) }}
                    type="password" />

                {type === 'student' && (
                    <>
                        <FormInputComponent
                            label="Doğum Tarihi"
                            value={formValues.birthDate}
                            onChange={(newValue) => { setFormValues({ ...formValues, birthDate: newValue }) }}
                            type="date" />

                        <FormInputComponent
                            label="Okul"
                            value={formValues.school}
                            onChange={(newValue) => { setFormValues({ ...formValues, school: newValue }) }}
                            type="text"
                            placeholder={"Boş geçilebilir"} />
                        <FormInputComponent
                            label="Sınıf-Şube"
                            value={formValues.gradeBranch}
                            onChange={(newValue) => { setFormValues({ ...formValues, gradeBranch: newValue }) }}
                            type="text"
                            placeholder={"Boş geçilebilir"} />
                    </>

                )}

                <button className={styles.fill} onClick={signupBtnHandle}>Kayıt Ol</button>
                <a href="/signin"><button className={styles.fill}>Geri</button></a>

            </div>
        </>
    )
}