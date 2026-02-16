import 'package:local_auth/local_auth.dart';

/// Biometric authentication (Fingerprint / Face ID)
class BiometricService {
  static final BiometricService _instance = BiometricService._internal();
  factory BiometricService() => _instance;
  final LocalAuthentication _auth = LocalAuthentication();

  BiometricService._internal();

  Future<bool> canCheckBiometrics() => _auth.canCheckBiometrics;

  Future<bool> isDeviceSupported() => _auth.isDeviceSupported();

  Future<List<BiometricType>> getAvailableBiometrics() => _auth.getAvailableBiometrics();

  Future<bool> authenticate({String reason = 'Authenticate to access CloudNest'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }

  Future<bool> get hasBiometrics async {
    if (!await isDeviceSupported()) return false;
    final types = await getAvailableBiometrics();
    return types.isNotEmpty;
  }
}
