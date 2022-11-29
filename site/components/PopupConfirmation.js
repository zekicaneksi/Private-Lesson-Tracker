import styles from './PopupConfirmation.module.css';

export default function PopupConfirmation(props) {


    function resetInfo() {
        props.setInfo((old) => {
            let newVal = { ...old };
            newVal.yesCallback = null;
            newVal.noCallback = null;
            newVal.msg = null;
            newVal.show = false;
            return newVal;
        });
    }

    function yesBtnHandle() {
        props.info.yesCallback();
        resetInfo();
    }

    function noBtnHandle() {
        props.info.noCallback();
        resetInfo();
    }

    if (props.info.show) {
        return (
            <div className={styles.container}>
                <p>{props.info.msg}</p>
                <div className={styles.flexDiv}>
                    <button onClick={yesBtnHandle}>Evet</button>
                    <button onClick={noBtnHandle}>Hayır</button>
                </div>
            </div>
        );
    }
}