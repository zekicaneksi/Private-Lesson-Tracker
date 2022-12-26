import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout.js';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import { teacherRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/teacher/messages.module.css';
import { useRouter } from 'next/router.js';

function Students(props) {

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
        props.studentList?.forEach(elem => {
            if (elem.relation_id == props.selectedRelationId) toReturn = elem;
        });
        return toReturn;
    }

    function sendMsgBtnHandle(type) {

        function getFullName(user) {
            return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
        }

        let selectedUser = getSelectedRelation();
        let label;
        let typeInfo = {
            name: (type == 'personal' ? 'personal' : 'guardian'),
            student_id: selectedUser.user_id
        };

        if (type == 'personal') {
            label = getFullName(selectedUser);
        } else {
            label = '(Velisi) ' + getFullName(selectedUser);
        }
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
                props.setStudentList((old) => {
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
        backendFetchGET('/getStudentRelations', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                props.setStudentList(res);
            }
        });
    }, []);

    useEffect(() => {
        let relation = getSelectedRelation();
        if (relation != null) {
            changeFormValue('nicknameInput', relation.nickname);
            changeFormValue('personalNoteInput', relation.content);
        }
    }, [props.selectedRelationId])

    useEffect(() => {
        if (props.studentList != undefined){
            let toSet = [];
            props.studentList.forEach(elem => {
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
    }, [props.studentList, formValues.searchInput]);

    useEffect(() => {
        if (selectElements.length > 0) props.setSelectedRelationId(selectElements[0].props.value);    
    }, [selectElements])

    return (
        <div className={`fieldContainer ${styles.container}`}>
            <p>Öğrenci Listesi</p>
            <input placeholder='Ara...' onChange={(event) => { changeFormValue('searchInput', event.target.value); props.setSelectedRelationId('') }}></input>
            <select size={5} onChange={(event) => { props.setSelectedRelationId(event.target.value) }}
                value={props.selectedRelationId}>
                {selectElements}
            </select>
            <div className={`${styles.container} ${styles.maxWidth} ${props.selectedRelationId == '' ? styles.disabled : ''} ${styles.alignItems}`}>
                <div className={styles.flexButtonContainer}>
                    <button onClick={() => { sendMsgBtnHandle('personal') }}>Mesaj Gönder</button>
                    <button onClick={() => { sendMsgBtnHandle('guardian') }}>Velisine Mesaj Gönder</button>
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

function MessageList(props) {

    const router = useRouter();

    const [searchInput, setSearchInput] = useState('');
    const [sendMsgInput, setSendMsgInput] = useState('');

    const messagesDivRef = useRef(null);

    function getFullName(user) {
        return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
    }

    useEffect(() => {
        if (props.studentList != undefined) {
            backendFetchGET('/getTeacherMessages', async (response) => {
                if (response.status == 200) {
                    
                    let messageList = await response.json();
                    props.setMessageInfo(messageList);
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

                    // Create the conversations with guardians
                    function guardianConversation(arr) {
                        messageList[arr].forEach(message => {
                            let user = messageList.userInfo.find(usr => usr.user_id == message.student_id);
                            let userFullName = getFullName(user);
                            let label = '(Velisi) ' + userFullName;
                            let conversationIndex = getConversationIndexIfNotPushLabel(label, { name: 'guardian', student_id: message.student_id });
                            let messageNameId = (message.guardian_id == undefined ? message.teacher_id : message.guardian_id);
                            let messageIdKeyName = (message.guardian_id == undefined ? "message_teacher_guardian_id" : "message_guardian_teacher_id");
                            pushMessage(message, conversationIndex, getFullName(messageList.userInfo.find(usr => usr.user_id == messageNameId)), messageIdKeyName + ':' + message[messageIdKeyName]);
                        });
                    }

                    guardianConversation("messagesTeacherToGuardian");
                    guardianConversation("messagesGuardianToTeacher");

                    // Create the lesson conversations
                    messageList.lessonMessages.forEach(message => {
                        let user = messageList.userInfo.find(usr => usr.user_id == message.sender_id);
                        let conversationIndex = getConversationIndexIfNotPushLabel('(' + message.lesson_id + ') ' + message.lesson_name, { name: 'lesson', lesson_id: message.lesson_id });
                        let senderName = (user.user_type_id == 3 ? ('(VELİ) (' + user.students.map(id => getFullName(messageList.userInfo.find(usr => usr.user_id == id))).join(' - ') + ') ' + getFullName(user)) : getFullName(user))
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
                    if (query){
                        if(conversationList.findIndex(elem => elem.label == router.query.label) == -1){
                            let typeInfo = {};
                            if (router.query.typeInfo_name == 'lesson'){
                                typeInfo.name = 'lesson';
                                typeInfo.lesson_id = router.query.typeInfo_lesson_id;
                            } else {
                                typeInfo.name = router.query.typeInfo_name;
                                typeInfo.student_id = router.query.typeInfo_student_id;
                            }
                            conversationList.unshift({
                                label: router.query.label,
                                messageList: [],
                                typeInfo: typeInfo
                            })        
                        }
                        props.setSelectedConversationLabel(router.query.label);
                    }
                    
                    if (conversationList.length > 0 && !query) props.setSelectedConversationLabel(conversationList[0].label);
                    props.setSortedMessageList(conversationList);
                    props.setLoading(false);
                }
            })
        }
    }, [props.studentList]);

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
        backendFetchPOST('/sendTeacherMessage', {
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

export default function Messages() {

    const [loading, setLoading] = useState(true)
    const [studentList, setStudentList] = useState();
    const [selectedRelationId, setSelectedRelationId] = useState('');

    const [messageInfo, setMessageInfo] = useState([]);
    const [sortedMessageList, setSortedMessageList] = useState(null);

    const [selectedConversationLabel, setSelectedConversationLabel] = useState('');

    return (
        <div className={`${styles.flexDiv} ${styles.flexRow} ${styles.pageContainer} ${loading ? 'disabled' : ''}`}>
            <Students
                studentList={studentList}
                setStudentList={setStudentList}
                selectedRelationId={selectedRelationId}
                setSelectedRelationId={setSelectedRelationId}
                setLoading={setLoading}
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                setSelectedConversationLabel={setSelectedConversationLabel} />
            <MessageList
                studentList={studentList}
                setLoading={setLoading}
                messageInfo={messageInfo}
                setMessageInfo={setMessageInfo}
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                selectedConversationLabel={selectedConversationLabel}
                setSelectedConversationLabel={setSelectedConversationLabel} />
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes={teacherRoutes}>
            {Messages}
        </Layout>
    );
}