import { useEffect } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch';
import styles from './SentRequests.module.css';
import { useState } from 'react';

export default function SentRequests(props) {


    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

    useEffect(() => {
        backendFetchGET('/sentRelationRequests', async (response) => {
            if (response.status == 200) {
                props.setSentRequests((await response.json()));
            }
        })
    }, []);

    function cancelRequestBtnHandle(){
        if(selectedOptionIndex==null) return;
        backendFetchPOST('/cancelRelationRequest', {relation_request_id: props.sentRequests[selectedOptionIndex].relation_request_id}, async (response) => {
            if(response.status == 200){
                let deleted_request_id = (await response.json()).relation_request_id;
                props.setSentRequests((old) => {
                    let newArr = [...old];
                    return newArr.filter((elem) => {
                        if(elem.relation_request_id = deleted_request_id) return false;
                        else return true;
                    });
                });
            }
        });
    }

    const sentRequests = props.sentRequests.map((elem) => {
        return <option key={elem.relation_request_id}>{elem.name + ' ' + elem.surname}</option>
    })

    return (
        <div className={`fieldContainer`}>
            <p>Giden İstekler</p>
            <div className={styles.flexDiv}>
                <select size={5} onChange={(event) => {setSelectedOptionIndex(event.target.selectedIndex)}}>
                    {sentRequests}
                </select>
                <button onClick={cancelRequestBtnHandle}>İptal Et</button>
            </div>
        </div>
    );
}