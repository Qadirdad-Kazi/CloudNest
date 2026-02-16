import 'package:flutter/material.dart';
import '../models/file_item.dart';
import '../models/folder.dart';
import '../services/file_service.dart';
import '../widgets/file_card.dart';
import '../widgets/folder_card.dart';
import 'main_layout.dart';

class StarredScreen extends StatefulWidget {
  const StarredScreen({super.key});

  @override
  State<StarredScreen> createState() => _StarredScreenState();
}

class _StarredScreenState extends State<StarredScreen> {
  final FileService _fileService = FileService();
  List<FileItem> _files = [];
  List<Folder> _folders = [];
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
      final files = await _fileService.getStarred();
      setState(() {
        _files = files;
        _folders = []; // Starred endpoint typically returns files only
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
      title: 'Starred',
      activeItem: 'starred',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : _files.isEmpty
                  ? const Center(child: Text('No starred items'))
                  : GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        childAspectRatio: 0.85,
                      ),
                      itemCount: _files.length,
                      itemBuilder: (_, i) => FileCard(file: _files[i], showActions: false),
                    ),
    );
  }
}
