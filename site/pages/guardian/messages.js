import { useRouter } from 'next/router.js';
import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout.js';
import { backendFetchGET, backendFetchPOST } from '../../utils/backendFetch.js';
import { guardianRoutes } from "../../utils/NavbarRoutes";
import styles from '../../styles/guardian/messages.module.css';

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

            backendFetchPOST('/sendGuardianMessage', {
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

    const [searchInput, setSeachInput] = useState('');

    const [relationElements, setRelationElements] = useState([]);
    const [teacherElements, setTeacherElements] = useState([]);


    function getSelectedRelation() {
        return props.relations.find(relation => relation.relation_id == props.selectedRelationId);
    }

    useEffect(() => {
        if (props.relations != undefined) {
            let toSet = [];
            props.relations.forEach(elem => {
                let fullName = elem.name + ' ' + elem.surname + ((elem.nickname != '' && elem.nickname != null) ? (' (' + elem.nickname + ')') : '');
                const pattern = new RegExp(searchInput, 'i');
                if (searchInput == '' || (fullName.search(pattern) != -1)) {
                    toSet.push(
                        <option key={elem.relation_id} value={elem.relation_id}>{fullName}</option>
                    );
                }
            })
            setRelationElements(toSet);
        }
    }, [props.relations, searchInput]);

    useEffect(() => {
        if (props.selectedRelationId == '') return;
        let teacherElements = [];
        if (props.teachers != undefined && props.relations != undefined && props.selectedRelationId != '') {
            let selectedRelation = getSelectedRelation();
            props.teachers.forEach(teacher => {
                let lessonList = [];
                teacher.lessons.forEach(lesson => {
                    if (lesson.students.findIndex(studentId => studentId == selectedRelation.user_id) != -1) lessonList.push(lesson.lesson_name);
                })
                if (lessonList.length > 0) {
                    let optionText = teacher.name + ' ' + teacher.surname + ' (' + lessonList.join(' - ') + ')'
                    teacherElements.push(
                        <option key={teacher.teacher_id} value={teacher.teacher_id}>{optionText}</option>
                    )
                }

            })
        }
        setTeacherElements(teacherElements);

    }, [props.selectedRelationId]);

    useEffect(() => {
        if (teacherElements.length > 0) props.setSelectedTeacherId(teacherElements[0].props.value);
    }, [teacherElements])

    useEffect(() => {
        if (relationElements.length > 0) props.setSelectedRelationId(relationElements[0].props.value);
    }, [relationElements])

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

    function sendTeacherMsgBtnHandle(){
        function getFullName(user) {
            return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
        }

        let teacher = props.teachers.find(usr => usr.teacher_id == props.selectedTeacherId);
        let selectedUser = getSelectedRelation();

        let label = '(Öğretmeni - ' + teacher.name + ' ' + teacher.surname + ') ' + getFullName(selectedUser);
        let typeInfo = {
            name: 'guardian',
            student_id: selectedUser.user_id,
            teacher_id: props.selectedTeacherId
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

    return (
        <div className={`fieldContainer ${styles.container}`}>
            <p>Öğrenciler</p>
            <input placeholder='Ara...' onChange={(event) => { setSeachInput(event.target.value); props.setSelectedRelationId('') }}></input>
            <select size={5} onChange={(event) => { props.setSelectedRelationId(event.target.value) }}
                value={props.selectedRelationId}>
                {relationElements}
            </select>
            <div className={`${styles.container} ${styles.maxWidth} ${props.selectedRelationId == '' ? 'disabled' : ''} ${styles.alignItems}`}>
                <div className={styles.flexButtonContainer}>
                    <button onClick={() => { sendMsgBtnHandle('personal') }}>Mesaj Gönder</button>
                </div>
                <div className={`${styles.flexDiv}`}>
                    <div className={`${styles.flexDiv} ${styles.fieldPair}`}>
                        <p>Öğretmenler</p>
                        <select size={5} value={props.selectedTeacherId}
                            onChange={(event) => { props.setSelectedTeacherId(event.target.value) }}>
                            {teacherElements}
                        </select>
                        <button onClick={sendTeacherMsgBtnHandle}>Öğretmene Mesaj Gönder</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Messages() {

    const router = useRouter();

    const [loading, setLoading] = useState(true);

    const [relations, setRelations] = useState();
    const [teachers, setTeachers] = useState();

    const [messageInfo, setMessageInfo] = useState([]);
    const [sortedMessageList, setSortedMessageList] = useState(null);

    const [selectedConversationLabel, setSelectedConversationLabel] = useState('');
    const [selectedRelationId, setSelectedRelationId] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');

    function getFullName(user) {
        return user.name + ' ' + user.surname + ((user.nickname != '' && user.nickname != null) ? (' (' + user.nickname + ')') : '');
    }

    useEffect(() => {
        backendFetchGET('/getRelationsOfGuardian', async (response) => {
            if (response.status == 200) {
                let res = await response.json();
                setRelations(res.relations);
                setTeachers(res.teachers);
            }
        });
    }, []);

    useEffect(() => {
        if (teachers == undefined || relations == undefined) return;
        backendFetchGET('/getGuardianMessages', async (response) => {
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

                // Create the conversations with guardians
                function guardianConversation(arr) {
                    messageList[arr].forEach(message => {
                        let user = messageList.userInfo.find(usr => usr.user_id == message.student_id);
                        let userFullName = getFullName(user);
                        let teacher = messageList.userInfo.find(usr => usr.user_id == message.teacher_id);
                        let label = '(Öğretmeni - ' + teacher.name + ' ' + teacher.surname + ') ' + userFullName;
                        let conversationIndex = getConversationIndexIfNotPushLabel(label, { name: 'guardian', student_id: message.student_id, teacher_id: message.teacher_id });
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
                    let senderName = (user.user_type_id == 3 ? ('(VELİ) ' + getFullName(user)) : (user.user_type_id == 1 ? '(Öğretmen) ' + getFullName(user) : getFullName(user)))
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
        });
    }, [teachers, relations])

    return (
        <div className={`${styles.flexDiv} ${styles.flexRow} ${styles.pageContainer} ${loading ? 'disabled' : ''}`}>
            <Relations
                relations={relations}
                teachers={teachers}
                selectedRelationId={selectedRelationId}
                setSelectedRelationId={setSelectedRelationId}
                selectedTeacherId={selectedTeacherId}
                setSelectedTeacherId={setSelectedTeacherId}
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                selectedConversationLabel={selectedConversationLabel}
                setSelectedConversationLabel={setSelectedConversationLabel}
                messageInfo={messageInfo}
                setMessageInfo={setMessageInfo}/>
            <MessageList
                selectedConversationLabel={selectedConversationLabel}
                setSelectedConversationLabel={setSelectedConversationLabel}
                sortedMessageList={sortedMessageList}
                setSortedMessageList={setSortedMessageList}
                messageInfo={messageInfo}
                setLoading={setLoading} />
        </div>
    )
}

Messages.getLayout = function getLayout(Messages) {

    return (
        <Layout routes={guardianRoutes}>
            {Messages}
        </Layout>
    );
}