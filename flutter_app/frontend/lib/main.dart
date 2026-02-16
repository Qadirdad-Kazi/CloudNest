import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/biometric_login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/starred_screen.dart';
import 'screens/shared_screen.dart';
import 'screens/recent_screen.dart';
import 'screens/trash_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'widgets/protected_route.dart';
import 'services/push_service.dart';
import 'services/background_sync_service.dart';
import 'services/widget_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize mobile services
  await _initializeMobileServices();
  
  runApp(const CloudNestApp());
}

Future<void> _initializeMobileServices() async {
  try {
    // Initialize push notifications
    await PushService().init();
    
    // Initialize background sync
    await BackgroundSyncService().init();
    
    // Initialize widget service
    await WidgetService().updateWidgetData();
    
    debugPrint('Mobile services initialized successfully');
  } catch (e) {
    debugPrint('Failed to initialize mobile services: $e');
  }
}

class CloudNestApp extends StatelessWidget {
  const CloudNestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer2<AuthProvider, ThemeProvider>(
        builder: (context, auth, theme, _) {
          return MaterialApp(
            title: 'CloudNest',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: theme.themeMode,
            initialRoute: '/',
            routes: {
              '/': (context) => const HomeScreen(),
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/biometric-login': (context) => const BiometricLoginScreen(),
              '/dashboard': (context) => const ProtectedRoute(child: DashboardScreen()),
              '/starred': (context) => const ProtectedRoute(child: StarredScreen()),
              '/shared': (context) => const ProtectedRoute(child: SharedScreen()),
              '/recent': (context) => const ProtectedRoute(child: RecentScreen()),
              '/trash': (context) => const ProtectedRoute(child: TrashScreen()),
              '/profile': (context) => const ProtectedRoute(child: ProfileScreen()),
              '/settings': (context) => const ProtectedRoute(child: SettingsScreen()),
            },
          );
        },
      ),
    );
  }
}
