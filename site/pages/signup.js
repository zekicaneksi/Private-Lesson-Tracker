import Head from 'next/head'
import styles from '../styles/Signup.module.css'
import { useEffect, useState } from 'react';
import {backendFetchPOST} from '../utils/backendFetch.js';

function FormInputComponent(props) {

    return (
        <div className={styles.flexRow}>
            <p className={styles.zeroMargin}>{props.label}</p>
            <input value={props.value}
                onChange={(event) => props.onChange(event.target.value)}
                type={props.type}
                placeholder={props.placeholder}></input>
        </div>
    );
}

export default function Signin() {

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

    function signupBtnHandle() {
        let toSend = {...formValues, type: type};
        setDisableForm(true);
        backendFetchPOST('/signup', toSend, (response) => {
            console.log(response);
            setDisableForm(false);
        })
    }

    return (
        <div className={`${styles.container} ${disableForm ? styles.test : ''}`}>
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
    )
}