import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_sidebar.dart';

class MainLayout extends StatelessWidget {
  final String title;
  final String activeItem;
  final Widget child;
  final List<Widget>? actions;
  final Widget? fab;

  const MainLayout({
    super.key,
    required this.title,
    required this.activeItem,
    required this.child,
    this.actions,
    this.fab,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: Icon(theme.darkMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => theme.toggleDarkMode(),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
              }
            },
          ),
          ...?actions,
        ],
      ),
      drawer: AppSidebar(
        activeItem: activeItem,
        storageUsed: 0, // TODO: from file provider
        storageLimit: 5 * 1024 * 1024 * 1024,
      ),
      body: child,
      floatingActionButton: fab,
    );
  }
}
