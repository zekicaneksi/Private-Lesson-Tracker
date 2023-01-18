import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

Future<String?> getCookie() async {
  const storage = FlutterSecureStorage();
  return storage.read(key: "cookie");
}

Future<void> setCookie(String value) {
  const storage = FlutterSecureStorage();
  return storage.write(key: "cookie", value: value);
}

Future<http.Response> post(String route, String jsonStringBody) async {
  String cookie = await getCookie() ?? "";
  return http.post(Uri.parse("${dotenv.env['BACKEND_ADDRESS']}$route"),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'cookie': cookie
      },
      body: jsonStringBody);
}

Future<http.Response> get(String route) async {
  String cookie = await getCookie() ?? "";
  return http.get(Uri.parse("${dotenv.env['BACKEND_ADDRESS']}$route"),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
        'cookie': cookie
      });
}