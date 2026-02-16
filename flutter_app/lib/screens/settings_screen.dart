import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import 'main_layout.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();

    return MainLayout(
      title: 'Settings',
      activeItem: 'settings',
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          SwitchListTile(
            title: const Text('Dark mode'),
            subtitle: const Text('Use dark theme'),
            value: theme.darkMode,
            onChanged: (_) => theme.toggleDarkMode(),
          ),
          const Divider(),
          const ListTile(
            title: Text('Notifications'),
            subtitle: Text('Manage notification preferences'),
          ),
          const ListTile(
            title: Text('Storage'),
            subtitle: Text('View storage usage'),
          ),
          const ListTile(
            title: Text('About CloudNest'),
            subtitle: Text('Version 1.0.0'),
          ),
        ],
      ),
    );
  }
}
