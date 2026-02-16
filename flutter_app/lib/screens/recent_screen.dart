import 'package:flutter/material.dart';
import '../models/file_item.dart';
import '../services/file_service.dart';
import '../utils/helpers.dart';
import '../widgets/file_card.dart';
import 'main_layout.dart';

class RecentScreen extends StatefulWidget {
  const RecentScreen({super.key});

  @override
  State<RecentScreen> createState() => _RecentScreenState();
}

class _RecentScreenState extends State<RecentScreen> {
  final FileService _fileService = FileService();
  List<FileItem> _files = [];
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
      final files = await _fileService.getRecent(days: 7);
      setState(() {
        _files = files;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'Recent',
      activeItem: 'recent',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : _files.isEmpty
                  ? const Center(child: Text('No recent files'))
                  : ListView.builder(
                      itemCount: _files.length,
                      itemBuilder: (_, i) {
                        final f = _files[i];
                        return ListTile(
                          leading: Icon(f.isImage ? Icons.image : Icons.insert_drive_file),
                          title: Text(f.name),
                          subtitle: Text(formatDateTime(f.lastAccessed ?? f.updatedAt)),
                          onTap: () {},
                        );
                      },
                    ),
    );
  }
}
