import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:private_lesson_tracker/index.dart';
import 'package:private_lesson_tracker/widgets/loading.dart';
import 'login_page.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'utils/backend_http_request.dart' as backend_http_request;

import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

Future<void> main() async {
  if (kReleaseMode) {
    await dotenv.load(fileName: ".env.production");
  } else {
    await dotenv.load(fileName: ".env.development");
  }

  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  FirebaseMessaging.instance.onTokenRefresh
      .listen(backend_http_request.saveTokenToDatabase);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lesson Tracker',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        backgroundColor: const Color(0xFFACBDBA),
        secondaryHeaderColor: const Color(0xFFEACDC2),
      ),
      home: const MyHomePage(title: 'Ders Takip'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  void checkLogin(BuildContext context) async {
    var response = await backend_http_request.get('/getUserInfo');
    final decoded = jsonDecode(response.body);

    if (!mounted) {
      didChangeDependencies();
      return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
          builder: (context) => (decoded['msg'] == 'NOT_LOGGED_IN'
              ? const LoginPage()
              : const Index())),
    );
  }

  @override
  void didChangeDependencies() {
    checkLogin(context);
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: Loading(
          isLoading: true,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
          ),
        ),
      ),
    );
  }
}
