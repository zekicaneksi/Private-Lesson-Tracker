CREATE DATABASE private_lesson_tracker
CHARACTER SET UTF8MB4;

USE private_lesson_tracker;

CREATE TABLE User_Type (
    user_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL
);

CREATE TABLE User (
	user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_type_id INT NOT NULL,
    name VARCHAR(40) NOT NULL,
    surname VARCHAR(40) NOT NULL,
    email VARCHAR(70) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    birth_date DATE,
    school VARCHAR(50),
    grade_branch VARCHAR(50),
    
    FOREIGN KEY (user_type_id) REFERENCES User_Type(user_type_id),
    CHECK ((LENGTH(TRIM(name)) != 0) AND (LENGTH(LTRIM(name)) = LENGTH(name)) AND (LENGTH(CONCAT('*', RTRIM(name), '*')) = LENGTH(CONCAT('*', name, '*')))),
    CHECK ((LENGTH(TRIM(surname)) != 0) AND (LENGTH(LTRIM(surname)) = LENGTH(surname)) AND (LENGTH(CONCAT('*', RTRIM(surname), '*')) = LENGTH(CONCAT('*', surname, '*')))),
    CHECK ((LENGTH(TRIM(email)) != 0) AND (LENGTH(LTRIM(email)) = LENGTH(email)) AND (LENGTH(CONCAT('*', RTRIM(email), '*')) = LENGTH(CONCAT('*', email, '*')))),
    CHECK ((LENGTH(TRIM(school)) != 0) AND (LENGTH(LTRIM(school)) = LENGTH(school)) AND (LENGTH(CONCAT('*', RTRIM(school), '*')) = LENGTH(CONCAT('*', school, '*')))),
    CHECK ((LENGTH(TRIM(grade_branch)) != 0) AND (LENGTH(LTRIM(grade_branch)) = LENGTH(grade_branch)) AND (LENGTH(CONCAT('*', RTRIM(grade_branch), '*')) = LENGTH(CONCAT('*', grade_branch, '*'))))
);

CREATE TABLE Lesson (
	lesson_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    teacher_id INT NOT NULL,
    ended BOOLEAN,
    
    FOREIGN KEY (teacher_id) REFERENCES User(user_id),
    CHECK ((LENGTH(TRIM(name)) != 0) AND (LENGTH(LTRIM(name)) = LENGTH(name)) AND (LENGTH(CONCAT('*', RTRIM(name), '*')) = LENGTH(CONCAT('*', name, '*'))))
);

CREATE TABLE Session (
	session_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    name VARCHAR(80) NOT NULL,
    date DATE NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    attendance_registered BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    CHECK (start_time <= end_time),
    CHECK ((LENGTH(TRIM(name)) != 0) AND (LENGTH(LTRIM(name)) = LENGTH(name)) AND (LENGTH(CONCAT('*', RTRIM(name), '*')) = LENGTH(CONCAT('*', name, '*'))))
);

CREATE TABLE Payment (
	payment_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    student_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    FOREIGN KEY (student_id) REFERENCES User (user_id)
);

CREATE TABLE Student_Lesson (
	student_lesson_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    lesson_id INT NOT NULL,
    
	FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    FOREIGN KEY (student_id) REFERENCES User (user_id),
    UNIQUE KEY (student_id, lesson_id)
);

CREATE TABLE Attendance (
	attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    existent BOOLEAN,
    
	FOREIGN KEY (student_id) REFERENCES User (user_id),
    FOREIGN KEY (session_id) REFERENCES Session (session_id),
    UNIQUE KEY (student_id, session_id)
);

CREATE TABLE Relation (
	relation_id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    
    FOREIGN KEY (user1_id) REFERENCES User (user_id),
    FOREIGN KEY (user2_id) REFERENCES User (user_id),
    
    CHECK (user1_id != user2_id),
    UNIQUE KEY (user1_id, user2_id)
);

CREATE TABLE Relation_Request (
	relation_request_id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    nickname VARCHAR(40),
    personal_note varchar(255),
    
    FOREIGN KEY (from_user_id) REFERENCES User (user_id),
    FOREIGN KEY (to_user_id) REFERENCES User (user_id),
    UNIQUE KEY (from_user_id, to_user_id),
    CHECK (to_user_id != from_user_id),
    CHECK ((LENGTH(TRIM(nickname)) != 0) AND (LENGTH(LTRIM(nickname)) = LENGTH(nickname)) AND (LENGTH(CONCAT('*', RTRIM(nickname), '*')) = LENGTH(CONCAT('*', nickname, '*')))),
    CHECK ((LENGTH(TRIM(personal_note)) != 0) AND (LENGTH(LTRIM(personal_note)) = LENGTH(personal_note)) AND (LENGTH(CONCAT('*', RTRIM(personal_note), '*')) = LENGTH(CONCAT('*', personal_note, '*'))))
);

DELIMITER //
CREATE TRIGGER checkRelationRequest BEFORE INSERT ON Relation_Request
FOR EACH ROW
BEGIN
	DECLARE fromUserTypeId INT;
    DECLARE toUserTypeId INT;
    SET fromUserTypeId = (SELECT user_type_id FROM User WHERE user_id = NEW.from_user_id);
    SET toUserTypeId = (SELECT user_type_id FROM User WHERE user_id = NEW.to_user_id);
    IF (fromUserTypeId != 2 OR toUserTypeId = 2) THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "checkRelationRequest error";
	ELSEIF (SELECT Count(*) FROM Relation_Request WHERE from_user_id = NEW.from_user_id AND to_user_id = NEW.to_user_id) != 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "duplicate";
    END IF;
    
    IF (SELECT Count(*) FROM Relation WHERE (user1_id = NEW.from_user_id AND user2_id = NEW.to_user_id) OR (user1_id = NEW.to_user_id AND user2_id = NEW.from_user_id)) > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "in relation";
	END IF;
END//
DELIMITER ;

CREATE TABLE Personal_Note (
	personal_note_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    for_user_id INT NOT NULL,
    nickname VARCHAR(40) NOT NULL DEFAULT '',
    content varchar(255) NOT NULL DEFAULT '',
    
    FOREIGN KEY (user_id) REFERENCES User (user_id),
    FOREIGN KEY (for_user_id) REFERENCES User (user_id),
    CHECK ((nickname = '') OR ((LENGTH(TRIM(nickname)) != 0) AND (LENGTH(LTRIM(nickname)) = LENGTH(nickname)) AND (LENGTH(CONCAT('*', RTRIM(nickname), '*')) = LENGTH(CONCAT('*', nickname, '*'))))),
    CHECK ((content = '') OR ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))),
    
    CHECK (user_id != for_user_id),
    UNIQUE KEY (user_id, for_user_id)
);

CREATE TABLE Message_Personal (
	message_personal_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content VARCHAR(150) NOT NULL,
	date DATETIME NOT NULL,
    
    FOREIGN KEY (sender_id) REFERENCES User(user_id),
    FOREIGN KEY (receiver_id) REFERENCES User(user_id),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

CREATE TABLE Message_Teacher_Guardian (
	message_teacher_guardian_id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    content VARCHAR(150) NOT NULL,
    date DATETIME NOT NULL,
    
    FOREIGN KEY (teacher_id) REFERENCES User(user_id),
    FOREIGN KEY (student_id) REFERENCES User(user_id),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

CREATE TABLE Message_Guardian_Teacher (
	message_guardian_teacher_id INT PRIMARY KEY AUTO_INCREMENT,
    guardian_id INT NOT NULL,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    content VARCHAR(150) NOT NULL,
    date DATETIME NOT NULL,
    
    FOREIGN KEY (guardian_id) REFERENCES User(user_id),
    FOREIGN KEY (teacher_id) REFERENCES User(user_id),
    FOREIGN KEY (student_id) REFERENCES User(user_id),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

CREATE TABLE Message_Lesson (
	message_lesson_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    lesson_id INT NOT NULL,
    content VARCHAR(150) NOT NULL,
    date DATETIME NOT NULL,
    
    FOREIGN KEY (sender_id) REFERENCES User(user_id),
    FOREIGN KEY (lesson_id) REFERENCES Lesson(lesson_id),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

CREATE TABLE Notification (
	notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content varchar(255) NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES User (user_id)
);

CREATE TABLE Assignment (
	assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    header VARCHAR(80) NOT NULL,
    content VARCHAR(255) NOT NULL,
    due DATETIME NOT NULL,
    done BOOLEAN,
    
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    CHECK ((LENGTH(TRIM(header)) != 0) AND (LENGTH(LTRIM(header)) = LENGTH(header)) AND (LENGTH(CONCAT('*', RTRIM(header), '*')) = LENGTH(CONCAT('*', header, '*')))),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

CREATE TABLE Assignment_Student (
	assignment_student_id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    done BOOLEAN,
    
    FOREIGN KEY (assignment_id) REFERENCES Assignment (assignment_id),
    FOREIGN KEY (student_id) REFERENCES User (user_id)
);

CREATE TABLE Note (
	note_id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    lesson_id INT,
    creation_date datetime NOT NULL,
    header VARCHAR(80) NOT NULL,
    content VARCHAR(255) NOT NULL,
    
    FOREIGN KEY (teacher_id) REFERENCES User (user_id),
    FOREIGN KEY (student_id) REFERENCES User (user_id),
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    CHECK ((LENGTH(TRIM(header)) != 0) AND (LENGTH(LTRIM(header)) = LENGTH(header)) AND (LENGTH(CONCAT('*', RTRIM(header), '*')) = LENGTH(CONCAT('*', header, '*')))),
    CHECK ((LENGTH(TRIM(content)) != 0) AND (LENGTH(LTRIM(content)) = LENGTH(content)) AND (LENGTH(CONCAT('*', RTRIM(content), '*')) = LENGTH(CONCAT('*', content, '*'))))
);

INSERT INTO User_Type (name) VALUES ('teacher'), ('student'), ('guardian')