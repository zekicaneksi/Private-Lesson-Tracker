import Head from 'next/head'
import styles from '../styles/Signin.module.css'

export default function Signin() {
    return (
      <div className={styles.container}>
        <Head>
          <title>Giriş</title>
        </Head>
  
        <div className={styles.flexRow}>
            <p className={styles.zeroMargin}>Email</p>
            <input></input>
        </div>

        <div className={styles.flexRow}>
            <p className={styles.zeroMargin}>Şifre</p>
            <input></input>
        </div>

        <button className={styles.fill}>Giriş Yap</button>
        <a href="/register"><button className={styles.fill}>Kayıt Ol</button></a>

      </div>
    )
  }