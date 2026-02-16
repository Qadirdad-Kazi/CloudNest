import 'package:flutter/material.dart';
import '../models/file_item.dart';
import '../models/folder.dart';
import '../services/file_service.dart';
import '../widgets/file_card.dart';
import '../widgets/folder_card.dart';
import 'main_layout.dart';

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  final FileService _fileService = FileService();
  List<dynamic> _items = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final items = await _fileService.getTrash();
      setState(() {
        _items = items;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _restore(dynamic item) async {
    final isFile = item is FileItem;
    try {
      await _fileService.restore(isFile ? item.id : (item as Folder).id, isFolder: !isFile);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Restored')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _deletePermanently(dynamic item) async {
    final isFile = item is FileItem;
    final name = isFile ? item.name : (item as Folder).name;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete permanently?'),
        content: Text('This cannot be undone. Delete "$name" forever?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _fileService.deletePermanently(isFile ? item.id : (item as Folder).id, isFolder: !isFile);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted permanently')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _emptyTrash() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Empty trash?'),
        content: const Text('All items will be permanently deleted. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Empty Trash'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _fileService.emptyTrash();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trash emptied')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'Trash',
      activeItem: 'trash',
      actions: [
        if (_items.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.delete_forever),
            onPressed: _emptyTrash,
          ),
      ],
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : _items.isEmpty
                  ? const Center(child: Text('Trash is empty'))
                  : ListView.builder(
                      itemCount: _items.length,
                      itemBuilder: (_, i) {
                        final item = _items[i];
                        final isFile = item is FileItem;
                        return ListTile(
                          leading: Icon(isFile ? Icons.insert_drive_file : Icons.folder),
                          title: Text(isFile ? item.name : (item as Folder).name),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.restore),
                                onPressed: () => _restore(item),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_forever, color: Colors.red),
                                onPressed: () => _deletePermanently(item),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}
