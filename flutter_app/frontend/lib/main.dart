import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/starred_screen.dart';
import 'screens/shared_screen.dart';
import 'screens/recent_screen.dart';
import 'screens/trash_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'widgets/protected_route.dart';

void main() {
  runApp(const CloudNestApp());
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
