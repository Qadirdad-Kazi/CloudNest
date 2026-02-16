import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/storage_info.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();
  static const String _userKey = 'user';

  Future<User> login(String email, String password) async {
    try {
    final res = await _api.post(ApiConfig.login, data: {
      'email': email,
      'password': password,
    });

    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String?;
    if (token != null) {
      await _api.setToken(token);
    }

    final user = User.fromJson(data);
    await _saveUser(user);
    return user;
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] ?? e.message : e.message;
      throw Exception(msg ?? 'Login failed');
    }
  }

  Future<User> register(String name, String email, String password) async {
    try {
    final res = await _api.post(ApiConfig.register, data: {
      'name': name,
      'email': email,
      'password': password,
    });

    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String?;
    if (token != null) {
      await _api.setToken(token);
    }

    final user = User.fromJson(data);
    await _saveUser(user);
    return user;
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] ?? e.message : e.message;
      throw Exception(msg ?? 'Registration failed');
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiConfig.logout);
    } catch (_) {}
    await _api.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  Future<User?> getCurrentUser() async {
    final token = await _api.getToken();
    if (token == null) return null;

    try {
      final res = await _api.get(ApiConfig.me);
      final user = User.fromJson(res.data as Map<String, dynamic>);
      await _saveUser(user);
      return user;
    } catch (_) {
      return await _getCachedUser();
    }
  }

  Future<User?> _getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_userKey);
    if (json == null) return null;
    try {
      return User.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<StorageInfo> getStorageInfo() async {
    try {
      final res = await _api.get(ApiConfig.usersStorage);
      return StorageInfo.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return StorageInfo.defaultStorage;
    }
  }

  Future<User> updateSettings(Map<String, dynamic> settings) async {
    final res = await _api.put(ApiConfig.usersSettings, data: settings);
    return User.fromJson(res.data as Map<String, dynamic>);
  }
}
