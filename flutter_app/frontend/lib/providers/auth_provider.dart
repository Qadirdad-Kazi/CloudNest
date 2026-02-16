import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../models/storage_info.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _auth = AuthService();
  final BiometricService _biometricService = BiometricService();
  
  User? _user;
  bool _isLoading = true;
  String? _error;
  bool _biometricEnabled = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get error => _error;
  bool get biometricEnabled => _biometricEnabled;

  AuthProvider() {
    _checkAuth();
    _checkBiometricStatus();
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

  Future<void> _checkBiometricStatus() async {
    try {
      _biometricEnabled = await _biometricService.isBiometricEnabled();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to check biometric status: $e');
    }
  }

  Future<User> login(String email, String password, {bool enableBiometric = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _user = await _auth.login(email, password);
      
      // Enable biometric if requested and available
      if (enableBiometric && await _biometricService.isAvailable) {
        await _biometricService.storeCredentials(email, password);
        await _biometricService.setBiometricEnabled(true);
        _biometricEnabled = true;
      }
      
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

  Future<User> loginWithBiometric() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Get stored credentials
      final credentials = await _biometricService.getStoredCredentials();
      
      if (credentials == null || credentials.isEmpty) {
        throw Exception('No stored biometric credentials found');
      }
      
      // Authenticate with biometrics
      final isAuthenticated = await _biometricService.authenticate(
        reason: 'Authenticate to access CloudNest',
        useFallback: false,
      );

      if (!isAuthenticated) {
        throw Exception('Biometric authentication failed');
      }
      
      // Login with stored credentials
      _user = await _auth.login(credentials['email']!, credentials['password']!);
      
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

  Future<void> toggleBiometric(bool enabled) async {
    try {
      if (enabled) {
        // Check if biometric is available
        if (!await _biometricService.isAvailable) {
          throw Exception('Biometric authentication is not available');
        }
        
        // Authenticate current user before enabling
        final isAuthenticated = await _biometricService.authenticate(
          reason: 'Authenticate to enable biometric login',
          useFallback: false,
        );
        
        if (!isAuthenticated) {
          throw Exception('Biometric authentication failed');
        }
        
        // Store current user credentials
        if (_user != null) {
          // You'll need to get the password from the user
          // For now, we'll just enable the setting
          await _biometricService.setBiometricEnabled(true);
        }
      } else {
        // Clear stored credentials and disable
        await _biometricService.clearStoredCredentials();
        await _biometricService.setBiometricEnabled(false);
      }
      
      _biometricEnabled = enabled;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
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
