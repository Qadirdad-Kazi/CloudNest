import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../utils/helpers.dart';

class AppSidebar extends StatelessWidget {
  final String activeItem;
  final int storageUsed;
  final int storageLimit;
  final VoidCallback? onItemTap;

  const AppSidebar({
    super.key,
    required this.activeItem,
    this.storageUsed = 0,
    this.storageLimit = 5 * 1024 * 1024 * 1024,
    this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.isAdmin;

    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface),
            child: Row(
              children: [
                Icon(Icons.cloud, size: 40, color: AppTheme.primaryColor),
                const SizedBox(width: 12),
                const Text('CloudNest', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _SidebarItem(icon: Icons.folder, label: 'My Drive', route: '/dashboard', active: activeItem == 'dashboard', onTap: () => _navigate(context, '/dashboard')),
                _SidebarItem(icon: Icons.star, label: 'Starred', route: '/starred', active: activeItem == 'starred', onTap: () => _navigate(context, '/starred')),
                _SidebarItem(icon: Icons.share, label: 'Shared', route: '/shared', active: activeItem == 'shared', onTap: () => _navigate(context, '/shared')),
                _SidebarItem(icon: Icons.access_time, label: 'Recent', route: '/recent', active: activeItem == 'recent', onTap: () => _navigate(context, '/recent')),
                _SidebarItem(icon: Icons.delete_outline, label: 'Trash', route: '/trash', active: activeItem == 'trash', onTap: () => _navigate(context, '/trash')),
                if (isAdmin) ...[
                  const Divider(),
                  const Padding(padding: EdgeInsets.all(12), child: Text('Admin', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                  _SidebarItem(icon: Icons.people, label: 'Users', route: '/admin/users', active: activeItem == 'admin', onTap: () => _navigate(context, '/admin/users')),
                ],
                const Divider(),
                _SidebarItem(icon: Icons.settings, label: 'Settings', route: '/settings', active: activeItem == 'settings', onTap: () => _navigate(context, '/settings')),
                _SidebarItem(icon: Icons.person, label: 'Profile', route: '/profile', active: activeItem == 'profile', onTap: () => _navigate(context, '/profile')),
              ],
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Storage', style: Theme.of(context).textTheme.bodySmall),
                    Text('${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: storageLimit > 0 ? (storageUsed / storageLimit).clamp(0.0, 1.0) : 0,
                    minHeight: 8,
                    backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                    valueColor: AlwaysStoppedAnimation(
                      storageUsed / storageLimit > 0.95 ? Colors.red : AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _navigate(BuildContext context, String route) {
    Navigator.pop(context);
    onItemTap?.call();
    Navigator.pushReplacementNamed(context, route);
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String route;
  final bool active;
  final VoidCallback onTap;

  const _SidebarItem({required this.icon, required this.label, required this.route, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: active ? AppTheme.primaryColor : null),
      title: Text(label),
      selected: active,
      onTap: onTap,
    );
  }
}
