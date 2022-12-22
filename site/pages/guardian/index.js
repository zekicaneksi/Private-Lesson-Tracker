import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.js';
import { backendFetchGET } from '../../utils/backendFetch.js';
import { dateToString } from '../../utils/formatConversions.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/guardian/index.module.css';

export default function Index() {

    const [pageInfo, setPageInfo] = useState();

    useEffect(() => {
        backendFetchGET('/getGuardianUpcomingPayments', async (response) => {
            if (response.status == 200) {
                setPageInfo(await response.json());
            }
        })
    }, [])

    const selectElems = pageInfo?.paymentList.map(payment => {
        let usr = pageInfo.studentList.find(student => student.user_id == payment.student_id);
        let usrText = usr.name + ' ' + usr.surname + ' ' + (usr.nickname != '' ? ('(' + usr.nickname + ')') : '');
        let optionText = dateToString(new Date(payment.due)) + ' - ' + payment.amount.substring(0, payment.amount.toString().indexOf('.')) + ' TL - ' + payment.lesson_name + ' - ' + usrText;
        return <option key={payment.payment_id} value={payment.payment_id}>{optionText}</option>
    })

    return (
        <div className={`${styles.pageContainer}`}>
            <div className={`fieldContainer`}>
                <p>Yaklaşan Ödemeler</p>
                <select size={10}>
                    {selectElems}
                </select>
            </div>
        </div>
    )
}

Index.getLayout = function getLayout(Index) {

    return (
        <Layout routes={guardianRoutes}>
            {Index}
        </Layout>
    );
}