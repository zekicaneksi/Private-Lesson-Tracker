import styles from './Popup.module.css';

export default function Popup(props){

    if(props.show){
        return(
            <div className={styles.container}>
                <p>{props.message}</p>
                <button onClick={() => {props.setPopupInfo({message:"",show:false})}}>Tamam</button>
            </div>
        );
    }
}