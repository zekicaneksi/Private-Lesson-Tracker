import styles from './RequestList.module.css';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch';
import { useEffect, useState } from 'react';

export default function RequestList(props){

    const [loading, setLoading] = useState(true);
    const [selectValues, setSelectValues] = useState([]);
    const [selectedRelationRequestId, setSelectedRelationRequestId] = useState(null);

    function getRequestInfo(){
        let toReturn;
        selectValues.forEach(elem => {
            if(elem.relation_request_id == selectedRelationRequestId) toReturn = elem;
        });
        return toReturn;
    }

    useEffect(() => {
        backendFetchGET('/pendingRelationRequests', async (response) => {
            if (response.status == 200) {
                setSelectValues(await response.json());
                setLoading(false);
            }
        });
    }, []);

    function acceptBtnHandle(){
        props.setLoading(true);

        backendFetchPOST('/acceptRelationRequest', {relation_request_id: selectedRelationRequestId}, async (response) => {
            if(response.status == 200){

                let res = await response.json();

                setSelectValues((old) => {
                    let newArr = [...old];
                    return newArr.filter(elem => {
                        if(elem.relation_request_id == selectedRelationRequestId) return false;
                        else return true;
                    });
                });
                
                props.setStudentList((old) => {
                    let newArr = [...old];
                    newArr.unshift(res);
                    return newArr;
                });
                
                setSelectedRelationRequestId(null);
                props.setLoading(false);
            }
        });

    }

    function rejectBtnHandle(){
        props.setLoading(true);
        backendFetchPOST('/rejectRelationRequest', {relation_request_id: selectedRelationRequestId}, async (response) => {
            if(response.status == 200){
                setSelectValues((old) => {
                    let newArr = [...old];
                    return newArr.filter(elem => {
                        if(elem.relation_request_id == selectedRelationRequestId) return false;
                        else return true;
                    });
                });

                setSelectedRelationRequestId(null);
                props.setLoading(false);
            }
        });
    }

    const selectElems = selectValues.map(elem => {
        return <option key={elem.relation_request_id} value={elem.relation_request_id}>{elem.name + ' ' + elem.surname}</option>
    });

    return (
        <div className={`fieldContainer ${styles.container} ${loading ? styles.disabled : ''}`}>
            <p>Gelen İstekler</p>
            <select size={5} onChange={(event) => {setSelectedRelationRequestId(event.target.value)}}>
                {selectElems}
            </select>
            <div className={`${(selectedRelationRequestId == null ? styles.disabled : '')}`}>
                <button onClick={acceptBtnHandle}>Kabul Et</button>
                <button onClick={rejectBtnHandle}>Reddet</button>
            </div>
        </div>
    );
}