import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:private_lesson_tracker/login_page.dart';
import 'utils/backend_http_request.dart' as backend_http_request;

class Index extends StatefulWidget {
  const Index({super.key});

  @override
  State<Index> createState() => _Index();
}

class _Index extends State<Index> {
  void getUserInfo() async {
    var response = await backend_http_request.get('/getUserInfo');
    final decoded = jsonDecode(response.body);
    print(response.body);
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
  void initState() {
    getUserInfo();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text("Ana Sayfa"),
        ),
        body: SizedBox(
          height: MediaQuery.of(context).size.height,
          width: MediaQuery.of(context).size.width,
          child: SingleChildScrollView(
            child: ElevatedButton(
                onPressed: () {
                  logout(context);
                },
                child: const Text('logout')),
          ),
        ));
  }
}
