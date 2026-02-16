import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../models/storage_info.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _auth = AuthService();
  User? _user;
  bool _isLoading = true;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get error => _error;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _auth.getCurrentUser();
      _error = null;
    } catch (e) {
      _user = null;
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<User> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _user = await _auth.login(email, password);
      _isLoading = false;
      notifyListeners();
      return _user!;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<User> register(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _user = await _auth.register(name, email, password);
      _isLoading = false;
      notifyListeners();
      return _user!;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _auth.logout();
    _user = null;
    _error = null;
    notifyListeners();
  }

  Future<StorageInfo> getStorageInfo() async => _auth.getStorageInfo();

  void setUser(User? user) {
    _user = user;
    notifyListeners();
  }
}
