import { useState } from 'react';
import styles from './StudentInfo.module.css';

export default function StudentInfo(props) {

    let studentInfo = {
        user_id: '',
        name: '',
        surname: '',
        school: '',
        grade_branch: '',
        birth_date: '',
        converted_birth_date: ''
    };

    props.studentList.forEach(elem => {
        if (elem.relation_id == props.selectedRelationId) {
            studentInfo = elem;
            let date = new Date(studentInfo.birth_date);
            studentInfo.converted_birth_date = date.getDay() + ' / ' + (date.getMonth() + 1) + ' / ' + date.getFullYear();
        }
    });

    function createInputPair(label, key) {
        return (
            <div key={key} className={styles.fieldPair}>
                <p>{label}</p>
                <input readOnly={true} className={styles.readOnlyInput} value={studentInfo[key]}></input>
            </div>
        );
    }

    const elems = [
        createInputPair('ID:', 'user_id'),
        createInputPair('Ad:', 'name'),
        createInputPair('Soyad:', 'surname'),
        createInputPair('Okul:', 'school'),
        createInputPair('Sınıf-Şube:', 'grade_branch'),
        createInputPair('Doğum Tarihi:', 'converted_birth_date')
    ];

    return (
        <div className={`fieldContainer ${styles.container} ${props.selectedRelationId == null ? styles.disabled : ''}`}>
            <p>Öğrenci Bilgileri</p>
            {elems}
        </div>
    );
}