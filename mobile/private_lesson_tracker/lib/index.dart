// ignore_for_file: prefer_collection_literals

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:private_lesson_tracker/login_page.dart';
import 'package:private_lesson_tracker/widgets/loading.dart';
import 'utils/backend_http_request.dart' as backend_http_request;

import 'package:private_lesson_tracker/pages/teacher/home.dart';
import 'package:private_lesson_tracker/pages/teacher/schedule.dart';
import 'package:private_lesson_tracker/pages/teacher/lessons.dart';
import 'package:private_lesson_tracker/pages/teacher/assignments.dart';
import 'package:private_lesson_tracker/pages/teacher/payments.dart';
import 'package:private_lesson_tracker/pages/teacher/students.dart';
import 'package:private_lesson_tracker/pages/teacher/messages.dart';
import 'package:private_lesson_tracker/pages/teacher/notes.dart';

import 'package:private_lesson_tracker/pages/student/home.dart';
import 'package:private_lesson_tracker/pages/student/lessons.dart';
import 'package:private_lesson_tracker/pages/student/assignments.dart';
import 'package:private_lesson_tracker/pages/student/teachers.dart';
import 'package:private_lesson_tracker/pages/student/guardians.dart';
import 'package:private_lesson_tracker/pages/student/messages.dart';

import 'package:private_lesson_tracker/pages/guardian/home.dart';
import 'package:private_lesson_tracker/pages/guardian/schedule.dart';
import 'package:private_lesson_tracker/pages/guardian/lessons.dart';
import 'package:private_lesson_tracker/pages/guardian/assignments.dart';
import 'package:private_lesson_tracker/pages/guardian/payments.dart';
import 'package:private_lesson_tracker/pages/guardian/students.dart';
import 'package:private_lesson_tracker/pages/guardian/messages.dart';

class Index extends StatefulWidget {
  const Index({super.key});

  @override
  State<Index> createState() => _Index();
}

class _Index extends State<Index> {
  UserInfo? userInfo;
  Widget? selectedPage;

  List<NavElemPair> teacherItems = [
    NavElemPair("Ana Sayfa", const TeacherHome()),
    NavElemPair("Takvim", const TeacherSchedule()),
    NavElemPair("Dersler", const TeacherLessons()),
    NavElemPair("Ödevler", const TeacherAssignments()),
    NavElemPair("Ödemeler", const TeacherPayments()),
    NavElemPair("Öğrenciler", const TeacherStudents()),
    NavElemPair("Mesajlar", const TeacherMessages()),
    NavElemPair("Notlar", const TeacherNotes())
  ];

  List<NavElemPair> studentItems = [
    NavElemPair("Ana Sayfa", const StudentHome()),
    NavElemPair("Dersler", const StudentLessons()),
    NavElemPair("Ödevler", const StudentAssignments()),
    NavElemPair("Öğretmenler", const StudentTeachers()),
    NavElemPair("Veliler", const StudentGuardians()),
    NavElemPair("Mesajlar", const StudentMessages())
  ];


  List<NavElemPair> guardianItems = [
    NavElemPair("Ana Sayfa", const GuardianHome()),
    NavElemPair("Takvim", const GuardianSchedule()),
    NavElemPair("Dersler", const GuardianLessons()),
    NavElemPair("Ödevler", const GuardianAssignments()),
    NavElemPair("Ödemeler", const GuardianPayments()),
    NavElemPair("Öğrenciler", const GuardianStudents()),
    NavElemPair("Mesajlar", const GuardianMessages())
  ];

  List<NavElemPair>? selectedType;

  void getUserInfo(BuildContext context) async {
    var response = await backend_http_request.get('/getUserInfo');
    final decoded = jsonDecode(response.body);

    if (!mounted) {
      didChangeDependencies();
      return;
    }

    if (decoded['msg'] == 'NOT_LOGGED_IN') {
      Navigator.pushReplacement(context,
          MaterialPageRoute(builder: (context) => (const LoginPage())));
    }

    setState(() {
      userInfo = UserInfo.fromJson(decoded);
      switch (userInfo?.userType) {
        case "student":
          selectedType = studentItems;
          break;
        case "teacher":
          selectedType = teacherItems;
          break;
        case "guardian":
          selectedType = guardianItems;
          break;
        default:
      }
    });
  }

  void logout(BuildContext context) async {
    const storage = FlutterSecureStorage();
    await storage.delete(key: 'cookie');

    if (!mounted) {
      return;
    }
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginPage()),
    );
  }

  @override
  void didChangeDependencies() {
    getUserInfo(context);
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Ana Sayfa")),
      body: selectedPage ?? selectedType?[0].widget,
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                color: Colors.blue,
              ),
              child: Text("${userInfo?.name} ${userInfo?.surname}"),
            ),
            if (selectedType == null) ...[
              const Loading(isLoading: true, child: Center())
            ] else ...[
              for (NavElemPair nav in selectedType!)
                ListTile(
                  title: Text(nav.name),
                  onTap: () {
                    setState(() {
                      selectedPage = nav.widget;
                    });
                    getUserInfo(context);
                    Navigator.pop(context);
                  },
                )
            ],
            ListTile(
                  title: const Text("Çıkış Yap"),
                  onTap: () {
                    logout(context);
                    Navigator.pop(context);
                  },
                )
          ],
        ),
      ),
    );
  }
}

// Below are JSON classes

class NavElemPair<String, Widget> {
  final String name;
  final Widget widget;

  NavElemPair(this.name, this.widget);
}

class UserInfo {
  int? userId;
  String? name;
  String? surname;
  String? userType;
  List<Notifications>? notifications;

  UserInfo(
      {this.userId,
      this.name,
      this.surname,
      this.userType,
      this.notifications});

  UserInfo.fromJson(Map<String, dynamic> json) {
    userId = json['user_id'];
    name = json['name'];
    surname = json['surname'];
    userType = json['user_type'];
    if (json['notifications'] != null) {
      notifications = <Notifications>[];
      json['notifications'].forEach((v) {
        notifications!.add(Notifications.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['user_id'] = userId;
    data['name'] = name;
    data['surname'] = surname;
    data['user_type'] = userType;
    if (notifications != null) {
      data['notifications'] = notifications!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Notifications {
  int? notificationId;
  String? content;
  bool? dismissable;

  Notifications({this.notificationId, this.content, this.dismissable});

  Notifications.fromJson(Map<String, dynamic> json) {
    notificationId = json['notification_id'];
    content = json['content'];
    dismissable = json['dismissable'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['notification_id'] = notificationId;
    data['content'] = content;
    data['dismissable'] = dismissable;
    return data;
  }
}
