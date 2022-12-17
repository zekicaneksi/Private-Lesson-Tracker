import styles from './WeeklyScheduleTable.module.css';

export default function WeeklyScheduleTable(props){

    let dayNames = [
        "Pazartesi",
        "Salı",
        "Çarşamba",
        "Perşembe",
        "Cuma",
        "Cumartesi",
        "Pazar"
    ];

    function dayElem(nameOfDay, sessionsArr){

        const sessionElems = sessionsArr.map((elem, index) => {
            let timeText = elem.startTime + ' - ' + elem.endTime;
            return <p key={index}>{timeText}<br></br>{elem.lessonName != undefined && elem.lessonName}{elem.lessonName != undefined && <br></br>}{elem.sessionName}</p>
        })

        return(
            <div key={nameOfDay} className={styles.weekDayDiv}>
                <div className={styles.weekNameDiv}>
                    <p>
                        {nameOfDay}
                    </p>
                </div>
                <div className={styles.sessionsDiv}>
                    {sessionElems}
                </div>
            </div>
        );
    }

    const toRender = dayNames.map((elem, index) => {
        return dayElem(elem, Object.values(props.content)[index]);
    });

    return(
        <div className={styles.container}>
            {toRender}
        </div>
    );
}