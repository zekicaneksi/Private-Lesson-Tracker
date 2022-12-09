import styles from './TransferBox.module.css';
import { useState } from 'react';
import img_doubleLeftArrows from '../public/double-left-arrows.svg';
import Image from 'next/image'

export default function TransferBox(props) {

    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
    
    function changeSide(newSide) {

        if (Object.values(props.elemArray)[selectedOptionIndex].side == newSide) return;

        props.setElemArray(old => {
            let toReturn = [...old];
            Object.values(toReturn)[selectedOptionIndex].side = newSide;
            return toReturn;
        });
        setSelectedOptionIndex(null);
    }

    let rightSideElems = [];
    let leftSideElems = [];

    props.elemArray.map((elem, index) => {
        let toPush = <option key={index} value={index}>{elem.optionText}</option>;
        if (elem.side == "right") rightSideElems.push(toPush);
        else leftSideElems.push(toPush);
    });

    return (
        <div className={styles.container}>
            <div className={`${styles.flexColumn} ${styles.flexGap}`}>
                <p>{props.leftSideLabel}</p>
                <select size={5} onChange={(event) => { setSelectedOptionIndex(event.target.value) }}>
                    {leftSideElems}
                </select>
            </div>

            <div className={styles.flexColumn}>
                <p>&nbsp;</p>
                <div className={`${styles.buttonsDiv} ${selectedOptionIndex == null ? styles.disabled : ''}`}>
                    <Image
                        onClick={() => { changeSide("left") }}
                        src={img_doubleLeftArrows}
                        alt="transfer right button" />
                    <Image
                        onClick={() => { changeSide("right") }}
                        src={img_doubleLeftArrows}
                        alt="transfer left button" />
                </div>
            </div>

            <div className={`${styles.flexColumn} ${styles.flexGap}`}>
                <p>{props.rightSideLabel}</p>
                <select size={5} onChange={(event) => { setSelectedOptionIndex(event.target.value) }}>
                    {rightSideElems}
                </select>
            </div>

        </div>
    );
}