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
    
    FOREIGN KEY (user_type_id) REFERENCES User_Type(user_type_id)
);

CREATE TABLE Lesson (
	lesson_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    teacher_id INT NOT NULL,
    ended BOOLEAN,
    
    FOREIGN KEY (teacher_id) REFERENCES User(user_id)
);

CREATE TABLE Session (
	session_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    name VARCHAR(80) NOT NULL,
    date DATE NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id),
    CHECK (start_time <= end_time)
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
    FOREIGN KEY (student_id) REFERENCES User (user_id)
);

CREATE TABLE Attendance (
	attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    existent BOOLEAN,
    
	FOREIGN KEY (student_id) REFERENCES User (user_id),
    FOREIGN KEY (session_id) REFERENCES Session (session_id)
);

CREATE TABLE Relation (
	relation_id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    
    FOREIGN KEY (user1_id) REFERENCES User (user_id),
    FOREIGN KEY (user2_id) REFERENCES User (user_id),
    
    CHECK (user1_id != user2_id)
);

CREATE TABLE Relation_Request (
	relation_request_id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    
    FOREIGN KEY (from_user_id) REFERENCES User (user_id),
    FOREIGN KEY (to_user_id) REFERENCES User (user_id),
    
    CHECK (from_user_id != to_user_id)
);

CREATE TABLE Personal_Note (
	personal_note_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    for_user_id INT NOT NULL,
    nickname VARCHAR(40),
    content varchar(255),
    
    FOREIGN KEY (user_id) REFERENCES User (user_id),
    FOREIGN KEY (for_user_id) REFERENCES User (user_id),
    
    CHECK (user_id != for_user_id)
);

CREATE TABLE Message_Type (
	message_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL
);

CREATE TABLE Message (
	message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    type_id INT NOT NULL,
    
    FOREIGN KEY (sender_id) REFERENCES User (user_id),
    FOREIGN KEY (receiver_id) REFERENCES User (user_id),
    FOREIGN KEY (type_id) REFERENCES Message_Type (message_type_id)
);

CREATE TABLE Notification (
	notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content varchar(255) NOT NULL,
    dismissable BOOLEAN NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES User (user_id)
);

CREATE TABLE Assignment (
	assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    creation_date DATETIME NOT NULL,
    header VARCHAR(80) NOT NULL,
    content VARCHAR(255) NOT NULL,
    due DATETIME NOT NULL,
    
    FOREIGN KEY (lesson_id) REFERENCES Lesson (lesson_id)
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
    creation_date datetime NOT NULL,
    header VARCHAR(80) NOT NULL,
    content VARCHAR(255) NOT NULL,
    
    FOREIGN KEY (teacher_id) REFERENCES User (user_id),
    FOREIGN KEY (student_id) REFERENCES User (user_id)
);

INSERT INTO User_Type (name) VALUES ('teacher'), ('student'), ('guardian')