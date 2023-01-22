import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:private_lesson_tracker/index.dart';
import 'register_page.dart';
import 'utils/backend_http_request.dart' as backend_http_request;
import 'widgets/loading.dart';

class _LoginResponse {
  String? msg;

  _LoginResponse();

  _LoginResponse.fromJson(Map<String, dynamic> json) {
    msg = json['msg'];
  }
}

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Giriş Yap"),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            LoginForm(),
          ],
        ),
      ),
    );
  }
}

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  LoginFormState createState() {
    return LoginFormState();
  }
}

class LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();

  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool isLoading = false;

  void loginBtnHandle(BuildContext context) async {
    void showSnackBar(String message) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(message),
      ));
    }

    setState(() {
      isLoading = true;
    });
    var response = await backend_http_request.post(
        "/login",
        jsonEncode(<String, String>{
          'email': emailController.text,
          'password': passwordController.text,
          'platform_type' : 'mobile'
        }));

    if (response.statusCode == 200) {
      String? rawCookie = response.headers['set-cookie'];
      if (rawCookie != null) {
        int index = rawCookie.indexOf(';');
        await backend_http_request.setCookie(rawCookie.substring(0, index));
        await backend_http_request.saveTokenToDatabase((await FirebaseMessaging.instance.getToken())!);
      }

      if (!mounted) {
        showSnackBar('Lütfen tekrar deneyin');
        return;
      }
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const Index()),
      );
    } else {
      _LoginResponse msg = _LoginResponse.fromJson(jsonDecode(response.body));
      showSnackBar(msg.msg == "INVALID_CREDENTIALS"
          ? "Email veya şifre hatalı!"
          : "Bilinmeyen Hata!");
    }
    setState(() {
      isLoading = false;
    });
  }

  @override
  void dispose() {
    // Clean up the controller when the widget is disposed.
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Loading(
      isLoading: isLoading,
      child: FractionallySizedBox(
        widthFactor: 0.9,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10.0),
            color: Theme.of(context).backgroundColor,
          ),
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: <Widget>[
                TextFormField(
                  controller: emailController,
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: "Email",
                    filled: true,
                    fillColor: Theme.of(context).secondaryHeaderColor,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Lütfen boş bırakmayın';
                    } else if ((!value.contains('@')) ||
                        (!value.contains('.'))) {
                      return 'Lütfen uygun bir mail adresi girin';
                    }
                    return null;
                  },
                ),
                const SizedBox(
                  height: 10,
                ),
                TextFormField(
                  controller: passwordController,
                  textInputAction: TextInputAction.done,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: "Şifre",
                    filled: true,
                    fillColor: Theme.of(context).secondaryHeaderColor,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Lütfen boş bırakmayın';
                    }
                    return null;
                  },
                ),
                const SizedBox(
                  height: 20,
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        loginBtnHandle(context);
                      }
                    },
                    child: const Text('Giriş Yap'),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const RegisterPage()),
                      );
                    },
                    child: const Text('Kayıt Ol'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
