import styles from './FormInputComponent.module.css';

export default function FormInputComponent(props) {

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