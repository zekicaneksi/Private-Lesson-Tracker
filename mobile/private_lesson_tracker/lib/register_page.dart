import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text("Kayıt Ol"),
        ),
        body: SizedBox(
          height: MediaQuery.of(context).size.height,
          width: MediaQuery.of(context).size.width,
          child: const SingleChildScrollView(
            child: RegisterForm(),
          ),
        ));
  }
}

class FormField {
  String name;
  bool obscure;
  TextEditingController controller = TextEditingController();
  String? Function(String?)? validator;
  FormField(this.name, this.obscure, this.validator);
}

class RegisterForm extends StatefulWidget {
  const RegisterForm({super.key});

  @override
  RegisterFormState createState() {
    return RegisterFormState();
  }
}

class RegisterFormState extends State<RegisterForm> {
  final _formKey = GlobalKey<FormState>();

  final List<List<String>> types = [
    ["teacher", "Öğretmen"],
    ["student", "Öğrenci"],
    ["guardian", "Veli"]
  ];
  String selectedType = "teacher";
  TextEditingController studentDateCtl = TextEditingController();
  DateTime? studentDate;

  final List<FormField> formFieldList = [
    FormField("Ad", false, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    }),
    FormField("Soyad", false, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    }),
    FormField("Email", false, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      } else if ((!value.contains('@')) || (!value.contains('.'))) {
        return 'Lütfen uygun bir mail adresi girin';
      }
      return null;
    }),
    FormField("Şifre", true, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    }),
    FormField("Tekrar Şifre", true, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    })
  ];

  final List<FormField> studentFormFieldList = [
    FormField("Okul", false, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    }),
    FormField("Sınıf-Şube", false, (value) {
      if (value == null || value.isEmpty) {
        return 'Lütfen boş bırakmayın';
      }
      return null;
    }),
  ];

  Future<void> datePickerForStudent() {
    return Future(() async {
      DateTime? date = DateTime(1900);
      FocusScope.of(context).nextFocus();
      date = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime(1900),
          lastDate: DateTime.now());

      if (date != null) {
        studentDateCtl.text =
            "${date.day.toString()}/${date.month.toString()}/${date.year.toString()}";
        studentDate = date;
      }
    });
  }

  void registerBtnHandle(BuildContext context) async {
    void showSnackBar(String message) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(message),
      ));
    }

    String getFormFieldTextByName(String name) {
      return formFieldList
          .firstWhere((element) => element.name == name)
          .controller
          .text;
    }

    String name = getFormFieldTextByName("Ad");
    String surname = getFormFieldTextByName("Soyad");
    String email = getFormFieldTextByName("Email");
    String password = getFormFieldTextByName("Şifre");
    String againPassword = getFormFieldTextByName("Tekrar Şifre");
    String birthDate = "";
    var holdDate = studentDate?.toIso8601String();
    if (holdDate != null) birthDate = holdDate;
    String school = studentFormFieldList[0].controller.text;
    String gradeBranch = studentFormFieldList[1].controller.text;

    if (password != againPassword) {
      showSnackBar("Şifreler Eşleşmiyor!");
    }

    var response = await http.post(Uri.parse("${dotenv.env['BACKEND_ADDRESS']}/signup"),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'name': name,
          'surname': surname,
          'email': email,
          'password': password,
          'passwordAgain': againPassword,
          'birthDate': birthDate,
          'school': school,
          'gradeBranch': gradeBranch,
          'type': selectedType
        }));

    String? rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      
      int index = rawCookie.indexOf(';');
      print(rawCookie.substring(0, index));
    }
    print('Response status: ${response.statusCode}');
    print('Response body: ${response.body}');
  }

  @override
  void dispose() {
    for (int i = 0; i < formFieldList.length; i++) {
      formFieldList[i].controller.dispose();
    }
    for (int i = 0; i < studentFormFieldList.length; i++) {
      studentFormFieldList[i].controller.dispose();
    }
    studentDateCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10.0),
        color: Theme.of(context).backgroundColor,
      ),
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                for (List<String> i in types) ...[
                  ElevatedButton(
                      onPressed: () {
                        setState(() {
                          selectedType = i[0];
                        });
                      },
                      child: Text(i[1]))
                ],
              ],
            ),
            const SizedBox(
              height: 10,
            ),
            for (FormField i in formFieldList) ...[
              TextFormField(
                obscureText: i.obscure,
                controller: i.controller,
                textInputAction: TextInputAction.next,
                keyboardType: (i.name != "Email"
                    ? TextInputType.text
                    : TextInputType.emailAddress),
                decoration: InputDecoration(
                  hintText: i.name,
                  filled: true,
                  fillColor: Theme.of(context).secondaryHeaderColor,
                ),
                validator: i.validator,
                onEditingComplete: (() {
                  FocusScope.of(context).nextFocus();
                  if (i.name == "Tekrar Şifre" && selectedType == "student") {
                    datePickerForStudent();
                  }
                }),
              ),
              const SizedBox(
                height: 20,
              )
            ],
            if (selectedType == 'student') ...[
              TextFormField(
                controller: studentDateCtl,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  hintText: "Doğum Tarihi",
                  filled: true,
                  fillColor: Theme.of(context).secondaryHeaderColor,
                ),
                showCursor: true,
                readOnly: true,
                onTap: datePickerForStudent,
                validator: ((value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen boş bırakmayın';
                  }
                  return null;
                }),
              ),
              const SizedBox(
                height: 20,
              ),
              for (FormField i in studentFormFieldList) ...[
                TextFormField(
                  obscureText: i.obscure,
                  controller: i.controller,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    hintText: i.name,
                    filled: true,
                    fillColor: Theme.of(context).secondaryHeaderColor,
                  ),
                  validator: i.validator,
                ),
                const SizedBox(
                  height: 20,
                )
              ]
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      registerBtnHandle(context);
                    }
                  },
                  child: const Text('Kayıt Ol')),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text('Geri')),
            ),
          ],
        ),
      ),
    );
  }
}