import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

/// Enhanced Biometric authentication (Fingerprint / Face ID)
class BiometricService {
  static final BiometricService _instance = BiometricService._internal();
  factory BiometricService() => _instance;
  final LocalAuthentication _auth = LocalAuthentication();
  final _secureStorage = FlutterSecureStorage();

  BiometricService._internal();

  // Check if biometric authentication is available
  Future<bool> get isAvailable async {
    try {
      return await _auth.canCheckBiometrics && await _auth.isDeviceSupported();
    } catch (e) {
      debugPrint('Biometric check failed: $e');
      return false;
    }
  }

  // Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      debugPrint('Failed to get biometric types: $e');
      return [];
    }
  }

  // Check if user has enabled biometric login
  Future<bool> get isBiometricEnabled async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('biometric_enabled') ?? false;
    } catch (e) {
      return false;
    }
  }

  // Enable/disable biometric authentication
  Future<void> setBiometricEnabled(bool enabled) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('biometric_enabled', enabled);
      
      if (!enabled) {
        // Clear stored credentials when disabled
        await _secureStorage.delete(key: 'biometric_token');
      }
    } catch (e) {
      debugPrint('Failed to set biometric enabled: $e');
    }
  }

  // Authenticate with biometrics
  Future<bool> authenticate({
    String reason = 'Authenticate to access CloudNest',
    bool useFallback = true,
  }) async {
    try {
      // Check if biometric is enabled
      if (!await isBiometricEnabled()) {
        return useFallback; // Allow fallback to password
      }

      final biometricAvailable = await isAvailable();
      if (!biometricAvailable) {
        return useFallback;
      }

      // Perform biometric authentication
      final result = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          useErrorDialogs: true,
          biometricOnly: true,
        ),
      );

      if (result) {
        // Store authentication timestamp for session management
        await _secureStorage.write('biometric_auth_time', 
          DateTime.now().toIso8601String());
      }

      return result;
    } catch (e) {
      debugPrint('Biometric authentication failed: $e');
      return useFallback;
    }
  }

  // Authenticate with biometrics for sensitive operations
  Future<bool> authenticateForSensitiveOperation(String operation) async {
    final biometricAvailable = await isAvailable();
    if (!biometricAvailable) {
      return false;
    }
    
    return await authenticate(
      reason: 'Authenticate to $operation',
      useFallback: false, // No fallback for sensitive operations
    );
  }

  // Get biometric type name for UI
  String getBiometricTypeName(BiometricType type) {
    switch (type) {
      case BiometricType.fingerprint:
        return 'Fingerprint';
      case BiometricType.face:
        return 'Face ID';
      case BiometricType.iris:
        return 'Iris Scanner';
      case BiometricType.strong:
        return 'Strong Authentication';
      case BiometricType.weak:
        return 'Weak Authentication';
      default:
        return 'Biometric';
    }
  }

  // Get user-friendly biometric status
  Future<String> getBiometricStatus() async {
    if (!await isAvailable()) {
      return 'Not Available';
    }
    
    if (!await isBiometricEnabled()) {
      return 'Disabled';
    }
    
    final types = await getAvailableBiometrics();
    if (types.isEmpty) {
      return 'No Methods';
    }
    
    final typeNames = types.map(getBiometricTypeName).join(', ');
    return 'Available: $typeNames';
  }

  // Check if last biometric authentication is still valid (within 5 minutes)
  Future<bool> isRecentAuthentication() async {
    try {
      final authTime = await _secureStorage.read('biometric_auth_time');
      if (authTime == null) return false;
      
      final lastAuth = DateTime.parse(authTime);
      final now = DateTime.now();
      final difference = now.difference(lastAuth);
      
      // Consider authentication valid for 5 minutes
      return difference.inMinutes <= 5;
    } catch (e) {
      return false;
    }
  }

  // Store credentials for quick login (encrypted)
  Future<void> storeCredentials(String email, String password) async {
    try {
      await _secureStorage.write('biometric_email', email);
      await _secureStorage.write('biometric_password', password);
      await _secureStorage.write('biometric_stored', 'true');
    } catch (e) {
      debugPrint('Failed to store credentials: $e');
    }
  }

  // Get stored credentials for quick login
  Future<Map<String, String>?> getStoredCredentials() async {
    try {
      final isStored = await _secureStorage.read('biometric_stored');
      if (isStored != 'true') return {};
      
      final email = await _secureStorage.read('biometric_email');
      final password = await _secureStorage.read('biometric_password');
      
      return {
        'email': email,
        'password': password,
      };
    } catch (e) {
      return {};
    }
  }

  // Clear stored credentials
  Future<void> clearStoredCredentials() async {
    try {
      await _secureStorage.delete('biometric_email');
      await _secureStorage.delete('biometric_password');
      await _secureStorage.delete('biometric_stored');
      await _secureStorage.delete('biometric_auth_time');
    } catch (e) {
      debugPrint('Failed to clear credentials: $e');
    }
  }
}
