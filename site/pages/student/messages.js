import Layout from '../../components/Layout.js';
import { studentRoutes } from "../../utils/NavbarRoutes";
import { useRouter } from 'next/router.js';
import { use, useEffect, useRef, useState } from 'react';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import styles from '../../styles/student/messages.module.css';

function MessageList(props) {
    const [searchInput, setSearchInput] = useState('');
    const [sendMsgInput, setSendMsgInput] = useState('');

    const messagesDivRef = useRef(null);

    function getFullName(user) {
        return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
    }

    useEffect(() => {
        if (props.sortedMessageList != null && props.sortedMessageList.length > 0 && props.selectedConversationLabel == '') props.setSelectedConversationLabel(props.sortedMessageList[0].label);
        messagesDivRef.current.scrollTop = messagesDivRef.current.scrollHeight;
    }, [props.sortedMessageList])

    useEffect(() => {
        setSendMsgInput('');
        messagesDivRef.current.scrollTop = messagesDivRef.current.scrollHeight;
    }, [props.selectedConversationLabel])

    useEffect(() => {
        let flag = false;
        props.sortedMessageList?.forEach(elem => {
            if (flag) return;
            const pattern = new RegExp(searchInput, 'i');
            if (searchInput == '' || (elem.label.search(pattern) != -1)) {
                if (props.selectedConversationLabel == '') {
                    props.setSelectedConversationLabel(elem.label);
                    flag = true;
                }
            }
        });
    }, [searchInput])

    function sendMsgBtnHandle() {
        props.setLoading(true);
        
        let typeInfo = props.sortedMessageList.find(elem => elem.label == props.selectedConversationLabel).typeInfo;
        
        backendFetchPOST('/sendStudentMessage', {
            typeInfo: typeInfo,
            content: sendMsgInput
        }, async (response) => {
            if (response.status == 200) {
                let insertId = (await response.json()).insertId;
                
                props.setSortedMessageList(old => {
                    let toReturn = JSON.parse(JSON.stringify(old));
                    let index = toReturn.findIndex(elem => elem.label == props.selectedConversationLabel);
                    toReturn[index].messageList.push({
                        message_id: toReturn[index].typeInfo.name + ':' + insertId,
                        sender_name: getFullName(props.messageInfo.userInfo.find(usr => usr.user_id == props.messageInfo.myId)),
                        content: sendMsgInput,
                        date: new Date()
                    })
                    return toReturn;
                })

                setSendMsgInput('');
                props.setLoading(false);
            }
        });
    }

    let conversationElems = [];
    props.sortedMessageList?.forEach(elem => {
        const pattern = new RegExp(searchInput, 'i');
        if (searchInput == '' || (elem.label.search(pattern) != -1)) {
            conversationElems.push(
                <option key={elem.label} value={elem.label}>{elem.label + (elem.messageList.length > 0 ? (' --- ' + (new Date(elem.messageList[elem.messageList.length - 1].date).toLocaleString())) : '')}</option>
            );
        }
    });

    let conversationMessages = [];
    if (props.sortedMessageList != null && props.selectedConversationLabel != '') {
        props.sortedMessageList.find(elem => elem.label == props.selectedConversationLabel).messageList.map(message => {
            conversationMessages.push(
                <div key={message.message_id} className={`${styles.messageDiv}`}>
                    <p>{message.sender_name + ' - ' + new Date(message.date).toLocaleString()}</p>
                    <p>{message.content}</p>
                </div>

            );
        })
    }
    return (
        <div className={`fieldContainer ${styles.flexDiv}`}>
            <p>Mesajlar</p>
            <input placeholder='Ara...' onChange={(event) => { setSearchInput(event.target.value); props.setSelectedConversationLabel(''); }}></input>
            <select size={5} value={props.selectedConversationLabel}
                onChange={(event) => { props.setSelectedConversationLabel(event.target.value) }}>
                {conversationElems}
            </select>
            <div className={`${styles.flexDiv}`}>
                <div ref={messagesDivRef}
                    className={`${styles.messageBoxContainer}`}>
                    {conversationMessages}
                </div>
                <div className={`${styles.flexDiv} ${styles.flexRow} ${styles.flexNoGap} ${props.selectedConversationLabel == '' ? 'disabled' : ''}`}>
                    <input placeholder='Mesajınız...' className={`${styles.flexOne}`} value={sendMsgInput}
                        onChange={(event) => { setSendMsgInput(event.target.value) }}></input>
                    <button onClick={sendMsgBtnHandle}>Gönder</button>
                </div>
            </div>
        </div>
    );
}

function Relations(props) {
    const [formValues, setFormValues] = useState({
        searchInput: '',
        selectedRelationId: null,
        personalNoteInput: ''
    });

    const [selectElements, setSelectElements] = useState([]);

    function changeFormValue(key, value) {
        setFormValues((old) => {
            let newVal = { ...old };
            newVal[key] = value;
            return newVal;
        })
    }

    function getSelectedRelation() {
        let toReturn;
        props.relations?.forEach(elem => {
            if (elem.relation_id == props.selectedRelationId) toReturn = elem;
        });
        return toReturn;
    }

    function sendMsgBtnHandle() {

        function getFullName(user) {
            return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
        }

        let selectedUser = getSelectedRelation();
        let label = getFullName(selectedUser);;
        let typeInfo = {
            name: 'personal',
            student_id: selectedUser.user_id
        };

        if (props.sortedMessageList.findIndex(elem => elem.label == label) != -1) props.setSelectedConversationLabel(label)
        else {
            props.setSortedMessageList(old => {
                let toReturn = JSON.parse(JSON.stringify(old));
                toReturn.unshift({
                    label: label,
                    messageList: [],
                    typeInfo: typeInfo
                })
                return toReturn;
            })
            props.setSelectedConversationLabel(label);
        }
    }

    function editBtnHandle() {
        props.setLoading(true);
        let personal_note_id = getSelectedRelation().personal_note_id;

        backendFetchPOST('/editPersonalNote', {
            nickname: formValues.nicknameInput,
            content: formValues.personalNoteInput,
            personal_note_id: personal_note_id
        }, async (response) => {
            if (response.status == 200) {
                props.setRelations((old) => {
                    let newValues = [...old];
                    newValues.forEach((elem, index) => {
                        if (elem.relation_id == props.selectedRelationId) {
                            newValues[index].nickname = formValues.nicknameInput;
                            newValues[index].content = formValues.personalNoteInput;
                        }
                    });
                    return newValues;
                })
                props.setLoading(false);
            }
        });
    }

    useEffect(() => {
        let relation = getSelectedRelation();
        if (relation != null) {
            changeFormValue('nicknameInput', relation.nickname);
            changeFormValue('personalNoteInput', relation.content);
        }
    }, [props.selectedRelationId]);

    useEffect(() => {
        if (props.relations != undefined){
            let toSet = [];
            props.relations.forEach(elem => {
                let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
                const pattern = new RegExp(formValues.searchInput, 'i');
                if (formValues.searchInput == '' || (fullName.search(pattern) != -1)) {
                    toSet.push(
                        <option key={elem.relation_id} value={elem.relation_id}>{fullName}</option>
                    );
                }
            })
            setSelectElements(toSet);       
        }
    }, [props.relations, formValues.searchInput]);

    useEffect(() => {
        if (selectElements.length > 0) props.setSelectedRelationId(selectElements[0].props.value);    
    }, [selectElements])
    
    return (
        <div className={`fieldContainer ${styles.container}`}>
            <p>Kişiler</p>
            <input placeholder='Ara...' onChange={(event) => { changeFormValue('searchInput', event.target.value); props.setSelectedRelationId('') }}></input>
            <select size={5} onChange={(event) => { props.setSelectedRelationId(event.target.value) }}
                value={props.selectedRelationId}>
                {selectElements}
            </select>
            <div className={`${styles.container} ${styles.maxWidth} ${props.selectedRelationId == '' ? 'disabled' : ''} ${styles.alignItems}`}>
                <div className={styles.flexButtonContainer}>
                    <button onClick={() => { sendMsgBtnHandle('personal') }}>Mesaj Gönder</button>
                </div>
                <div className={`${styles.flexDiv}`}>
                    <div className={`${styles.flexDiv} ${styles.fieldPair}`}>
                        <p>Kişisel Not</p>
                        <textarea className={styles.noteTextarea}
                            value={formValues.personalNoteInput} onChange={(event) => { changeFormValue('personalNoteInput', event.target.value) }}></textarea>
                    </div>
                </div>
                <button onClick={editBtnHandle}>Düzenle</button>
            </div>
        </div>
    );
}

export default function Messages() {

    const router = useRouter();
    
    const [loading, setLoading] = useState(true);

    const [relations, setRelations] = useState();
    const [messageInfo, setMessageInfo] = useState([]);
    const [sortedMessageList, setSortedMessageList] = useState(null);

    const [selectedConversationLabel, setSelectedConversationLabel] = useState('');
    const [selectedRelationId, setSelectedRelationId] = useState('');

    function getFullName(user) {
        return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
    }

    useEffect(() => {
        backendFetchGET('/getRelationsOfStudent', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setRelations(res);
            }
        });
    }, []);

    useEffect(() => {
        if (relations != undefined){
            backendFetchGET('/getStudentMessages', async (response) => {
                if (response.status == 200) {
                    
                    let messageList = await response.json();
                    setMessageInfo(messageList);
    
                    let conversationList = [];
    
                    function getConversationIndexIfNotPushLabel(label, typeInfo) {
                        let conversationIndex = conversationList.findIndex(conversation => conversation.label == label);
                        if (conversationIndex == -1) {
                            conversationIndex = conversationList.push({
                                typeInfo: typeInfo,
                                label: label,
                                messageList: []
                            }) - 1;
                        }
                        return conversationIndex;
                    }
                    
                    function pushMessage(message, conversationIndex, senderName, messageId) {
                        conversationList[conversationIndex].messageList.push({
                            message_id: messageId,
                            sender_name: senderName,
                            content: message.content,
                            date: message.date
                        });
                    }
                    
                    // Create the conversations for personal messages
                    messageList.personalMessages.forEach(personalMessage => {
                        let idToSearchFor = (personalMessage.sender_id == messageList.myId ? personalMessage.receiver_id : personalMessage.sender_id);
                        let user = messageList.userInfo.find(usr => usr.user_id == idToSearchFor);
                        let conversationIndex = getConversationIndexIfNotPushLabel(getFullName(user), { name: 'personal', student_id: idToSearchFor });
                        pushMessage(personalMessage, conversationIndex, getFullName(messageList.userInfo.find(usr => usr.user_id == personalMessage.sender_id)), "message_personal_id:" + personalMessage.message_personal_id);
                    });
                    
                    // Create the lesson conversations
                    messageList.lessonMessages.forEach(message => {
                        let user = messageList.userInfo.find(usr => usr.user_id == message.sender_id);
                        let conversationIndex = getConversationIndexIfNotPushLabel('(' + message.lesson_id + ') ' + message.lesson_name, { name: 'lesson', lesson_id: message.lesson_id });
                        let senderName = getFullName(user);
                        pushMessage(message, conversationIndex, senderName, "message_lesson_id:" + message.message_lesson_id);
                    });
                    
                    // Sort all the conversations
                    conversationList.forEach(conversation => {
                        conversation.messageList.sort((a, b) => {
                            if (new Date(a.date) < new Date(b.date)) return -1;
                            else return 1;
                        });
                    });
    
                    // Sort conversation list by last message
                    conversationList.sort((a, b) => {
                        let a_last_date;
                        let b_last_date;
                        if (a.messageList.length > 0) a_last_date = new Date(a.messageList[a.messageList.length - 1].date);
                        if (b.messageList.length > 0) b_last_date = new Date(b.messageList[b.messageList.length - 1].date);
                        if (a_last_date > b_last_date) return -1;
                        else if (a_last_date < b_last_date) return 1;
                        else return 0;
                    });
    
                    // Check if came with a query
                    let query = false;
                    if (Object.keys(router.query).length != 0) query = true;
                    if (query) {
                        if (conversationList.findIndex(elem => elem.label == router.query.label) == -1) {
                            let typeInfo = {};
                            if (router.query.typeInfo_name == 'lesson') {
                                typeInfo.name = 'lesson';
                                typeInfo.lesson_id = router.query.typeInfo_id;
                            } else {
                                typeInfo.name = router.query.typeInfo_name;
                                typeInfo.student_id = router.query.typeInfo_id;
                            }
                            conversationList.unshift({
                                label: router.query.label,
                                messageList: [],
                                typeInfo: typeInfo
                            })
                        }
                        setSelectedConversationLabel(router.query.label);
                    }
    
                    if (conversationList.length > 0 && !query) setSelectedConversationLabel(conversationList[0].label);
                    setSortedMessageList(conversationList);
                    setLoading(false);
                }
            })
        }
    }, [relations])



    return (
        <div className={`${styles.flexDiv} ${styles.flexRow} ${styles.pageContainer} ${loading ? 'disabled' : ''}`}>
            <Relations
                selectedRelationId={selectedRelationId}
                setSelectedRelationId={setSelectedRelationId}
                relations={relations}
                setRelations={setRelations}
                setLoading={setLoading}
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                setSelectedConversationLabel={setSelectedConversationLabel} />
            <MessageList
                selectedConversationLabel={selectedConversationLabel}
                setSelectedConversationLabel={setSelectedConversationLabel} 
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                messageInfo={messageInfo}
                setLoading={setLoading}/>
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes={studentRoutes}>
            {Messages}
        </Layout>
    );
}