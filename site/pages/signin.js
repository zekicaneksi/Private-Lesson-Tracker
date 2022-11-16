import Head from 'next/head'
import styles from '../styles/Signin.module.css';
import Popup from '../components/Popup.js';
import FormInputComponent from '../components/FormInputComponent.js';
import { backendFetchPOST } from '../utils/backendFetch';
import CheckUserLoginLayout from '../components/CheckUserLoginLayout';
import { useState } from 'react';

export default function Signin() {

  const [popupInfo, setPopupInfo] = useState({ msg: "", show: false })
  const [disableForm, setDisableForm] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  function showPopup(msg) {
    setPopupInfo({ message: msg, show: true });
  }

  function signinBtnHandle() {
    let toSend = { ...formValues };
    setDisableForm(true);

    backendFetchPOST('/login', toSend, async (response) => {
      if (response.status != 200) {
        switch ((await response.json()).msg) {
          case "INVALID_CREDENTIALS":
            showPopup("Email veya şifre hatalı");
            break;
          default:
            showPopup("Bilinmeyen hata");
            break;
        }
        setDisableForm(false);
      } else {
        let route = await response.json();
        window.location.href = "/" + route.msg;
      }
    });
  }

  return (
    <>
      <Popup
        message={popupInfo.message}
        show={popupInfo.show}
        setPopupInfo={setPopupInfo} />
      <div className={`${styles.container} ${disableForm ? styles.disable : ''}`}>
        <Head>
          <title>Giriş</title>
        </Head>

        <FormInputComponent
          label="Email"
          value={formValues.email}
          onChange={(newValue) => { setFormValues({ ...formValues, email: newValue }) }}
          type="text"
        />

        <FormInputComponent
          label="Şifre"
          value={formValues.password}
          onChange={(newValue) => { setFormValues({ ...formValues, password: newValue }) }}
          type="password"
        />

        <button className={styles.fill} onClick={signinBtnHandle}>Giriş Yap</button>
        <a href="/signup"><button className={styles.fill}>Kayıt Ol</button></a>

      </div>
    </>
  )
}

Signin.getLayout = function getLayout(Signin) {

  return (
      <CheckUserLoginLayout>
          {Signin}
      </CheckUserLoginLayout>
  );
}