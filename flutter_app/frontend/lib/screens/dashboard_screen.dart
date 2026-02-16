import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:provider/provider.dart';
import '../models/file_item.dart';
import '../models/folder.dart';
import '../services/file_service.dart';
import '../services/folder_service.dart';
import '../services/share_service.dart';
import '../services/download_service.dart';
import '../services/image_compress_service.dart';
import '../services/offline_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../theme/app_theme.dart';
import '../utils/helpers.dart';
import '../widgets/file_card.dart';
import '../widgets/folder_card.dart';
import 'main_layout.dart';
import 'file_preview_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FileService _fileService = FileService();
  final FolderService _folderService = FolderService();
  final ShareService _shareService = ShareService();

  List<FileItem> _files = [];
  List<Folder> _folders = [];
  bool _loading = true;
  String _currentPath = '/';
  String _searchQuery = '';
  String _error = '';
  double _uploadProgress = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  List<String> get _breadcrumbs {
    if (_currentPath == '/') return ['Home'];
    return ['Home', ..._currentPath.split('/').where((s) => s.isNotEmpty)];
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final results = await Connectivity().checkConnectivity();
      final isOffline = results.isEmpty ||
          (results.length == 1 && results.first == ConnectivityResult.none) ||
          !results.any((r) =>
              r == ConnectivityResult.wifi ||
              r == ConnectivityResult.mobile ||
              r == ConnectivityResult.ethernet);
      if (isOffline) {
        final cachedFiles = await OfflineService().getCachedFiles(_currentPath);
        final cachedFolders = await OfflineService().getCachedFolders(_currentPath);
        setState(() {
          _files = cachedFiles;
          _folders = cachedFolders;
          _loading = false;
          _error = cachedFiles.isEmpty && cachedFolders.isEmpty ? 'Offline - no cached data' : '';
        });
      } else {
        final files = await _fileService.getFiles(path: _currentPath);
        final folders = await _fileService.getFolders(path: _currentPath);
        await OfflineService().cacheFiles(_currentPath, files);
        await OfflineService().cacheFolders(_currentPath, folders);
        setState(() {
          _files = files;
          _folders = folders;
          _loading = false;
        });
      }
    } catch (e) {
      final cachedFiles = await OfflineService().getCachedFiles(_currentPath);
      final cachedFolders = await OfflineService().getCachedFolders(_currentPath);
      setState(() {
        _files = cachedFiles;
        _folders = cachedFolders;
        _error = cachedFiles.isEmpty && cachedFolders.isEmpty ? e.toString() : '';
        _loading = false;
      });
    }
  }

  Future<void> _uploadFile() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: false);
    if (result == null || result.files.isEmpty) return;

    var filePath = result.files.single.path;
    if (filePath == null) return;

    var file = File(filePath);
    if (file.path.toLowerCase().contains('.jpg') || file.path.toLowerCase().contains('.jpeg') ||
        file.path.toLowerCase().contains('.png')) {
      final compressed = await ImageCompressService().compress(file);
      if (compressed != null) file = compressed;
    }

    setState(() => _uploadProgress = 0);

    try {
      await _fileService.uploadFile(file, parentPath: _currentPath, onProgress: (sent, total) {
        if (mounted && total > 0) {
          setState(() => _uploadProgress = sent / total);
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File uploaded')));
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadProgress = 0);
    }
  }

  Future<void> _createFolder() async {
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final c = TextEditingController();
        return AlertDialog(
          title: const Text('Create folder'),
          content: TextField(
            controller: c,
            decoration: const InputDecoration(labelText: 'Folder name'),
            autofocus: true,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, c.text.trim()),
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
    if (name == null || name.isEmpty) return;
    try {
      await _folderService.createFolder(name, path: _currentPath);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Folder created')));
        _loadData();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _deleteItem(dynamic item) async {
    final isFile = item is FileItem;
    final name = isFile ? item.name : (item as Folder).name;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Move to trash?'),
        content: Text('Move "$name" to trash?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Move to Trash')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _fileService.moveToTrash(isFile ? item.id : item.id, isFolder: !isFile);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Moved to trash')));
        _loadData();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _renameItem(dynamic item) async {
    final isFile = item is FileItem;
    final currentName = isFile ? item.name : (item as Folder).name;
    final newName = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final c = TextEditingController(text: currentName);
        return AlertDialog(
          title: const Text('Rename'),
          content: TextField(
            controller: c,
            decoration: const InputDecoration(labelText: 'New name'),
            autofocus: true,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, c.text.trim()), child: const Text('Rename')),
          ],
        );
      },
    );
    if (newName == null || newName.isEmpty || newName == currentName) return;
    try {
      if (isFile) {
        await _fileService.renameFile(item.id, newName);
      } else {
        await _folderService.renameFolder(item.id, newName);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Renamed')));
        _loadData();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _shareItem(dynamic item) async {
    final isFile = item is FileItem;
    try {
      final link = await _shareService.createShare(
        isFile ? item.id : (item as Folder).id,
        itemType: isFile ? 'file' : 'folder',
        isPublic: true,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Share link: ${link.url}')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _showSearch() async {
    final query = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final c = TextEditingController();
        return AlertDialog(
          title: const Text('Search'),
          content: TextField(
            controller: c,
            decoration: const InputDecoration(hintText: 'Search files and folders...'),
            autofocus: true,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, c.text.trim()), child: const Text('Search')),
          ],
        );
      },
    );
    if (query == null || query.isEmpty) return;
    try {
      final results = await _fileService.search(query);
      if (mounted) {
        showModalBottomSheet(
          context: context,
          builder: (ctx) => DraggableScrollableSheet(
            initialChildSize: 0.6,
            expand: false,
            builder: (_, controller) => ListView.builder(
              controller: controller,
              itemCount: results.length,
              itemBuilder: (_, i) {
                final item = results[i];
                if (item is FileItem) {
                  return ListTile(
                    leading: const Icon(Icons.insert_drive_file),
                    title: Text(item.name),
                    onTap: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => FilePreviewScreen(file: item)),
                      );
                    },
                  );
                } else {
                  final folder = item as Folder;
                  return ListTile(
                    leading: const Icon(Icons.folder),
                    title: Text(folder.name),
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() => _currentPath = folder.path);
                      _loadData();
                    },
                  );
                }
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Search failed: $e')));
    }
  }

  Future<void> _downloadFile(FileItem f) async {
    if (f.url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Download URL not available')));
      return;
    }
    try {
      final file = await DownloadService().download(f.url, f.name);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(file != null ? 'Downloaded to ${file.path}' : 'Download failed')),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Download failed: $e')));
    }
  }

  Future<void> _starItem(dynamic item) async {
    final isFile = item is FileItem;
    try {
      if (isFile) {
        await _fileService.toggleStar(item.id);
      } else {
        await _fileService.toggleFolderStar((item as Folder).id);
      }
      _loadData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'My Drive',
      activeItem: 'dashboard',
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () => _showSearch(),
        ),
      ],
      fab: FloatingActionButton.extended(
        onPressed: _uploadFile,
        icon: const Icon(Icons.upload_file),
        label: const Text('Upload'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            children: _breadcrumbs.asMap().entries.map((e) {
              final isLast = e.key == _breadcrumbs.length - 1;
              return InkWell(
                onTap: isLast ? null : () {
                  if (e.key == 0) {
                    setState(() => _currentPath = '/');
                  } else {
                    setState(() => _currentPath = '/' + _breadcrumbs.sublist(1, e.key + 1).join('/'));
                  }
                  _loadData();
                },
                child: Text(
                  e.value,
                  style: TextStyle(
                    fontWeight: isLast ? FontWeight.bold : FontWeight.normal,
                    color: isLast ? null : Theme.of(context).colorScheme.primary,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              FilledButton.icon(
                onPressed: _uploadFile,
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload'),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: _createFolder,
                icon: const Icon(Icons.create_new_folder),
                label: const Text('New folder'),
              ),
            ],
          ),
          if (_uploadProgress > 0 && _uploadProgress < 1)
            Padding(
              padding: const EdgeInsets.all(8),
              child: LinearProgressIndicator(value: _uploadProgress),
            ),
          const SizedBox(height: 16),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadData,
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error.isNotEmpty
                      ? Center(child: Text(_error))
                      : _files.isEmpty && _folders.isEmpty
                          ? ListView(
                              children: [
                                SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.5,
                                  child: const Center(
                                    child: Text('No files or folders.\nPull down to refresh.'),
                                  ),
                                ),
                              ],
                            )
                          : GridView.count(
                            crossAxisCount: _getCrossAxisCount(context),
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                            childAspectRatio: 0.85,
                            children: [
                              ..._folders.map((f) => Slidable(
                                    key: ValueKey(f.id),
                                    endActionPane: ActionPane(
                                      motion: const DrawerMotion(),
                                      children: [
                                        SlidableAction(onPressed: (_) => _starItem(f), icon: Icons.star, label: 'Star'),
                                        SlidableAction(onPressed: (_) => _shareItem(f), icon: Icons.share, label: 'Share'),
                                        SlidableAction(onPressed: (_) => _renameItem(f), icon: Icons.edit, label: 'Rename'),
                                        SlidableAction(
                                          onPressed: (_) => _deleteItem(f),
                                          icon: Icons.delete,
                                          backgroundColor: Colors.red,
                                          label: 'Delete',
                                        ),
                                      ],
                                    ),
                                    child: FolderCard(
                                      name: f.name,
                                      starred: f.starred,
                                      onTap: () {
                                        setState(() => _currentPath = f.path);
                                        _loadData();
                                      },
                                      onStar: () => _starItem(f),
                                      onShare: () => _shareItem(f),
                                      onRename: () => _renameItem(f),
                                      onDelete: () => _deleteItem(f),
                                    ),
                                  )),
                              ..._files.map((f) => Slidable(
                                    key: ValueKey(f.id),
                                    endActionPane: ActionPane(
                                      motion: const DrawerMotion(),
                                      children: [
                                        SlidableAction(
                                          onPressed: (_) => _starItem(f),
                                          icon: Icons.star,
                                          label: 'Star',
                                        ),
                                        SlidableAction(
                                          onPressed: (_) => _shareItem(f),
                                          icon: Icons.share,
                                          label: 'Share',
                                        ),
                                        SlidableAction(
                                          onPressed: (_) => _downloadFile(f),
                                          icon: Icons.download,
                                          label: 'Download',
                                        ),
                                        SlidableAction(
                                          onPressed: (_) => _deleteItem(f),
                                          icon: Icons.delete,
                                          backgroundColor: Colors.red,
                                          label: 'Delete',
                                        ),
                                      ],
                                    ),
                                    child: FileCard(
                                      file: f,
                                      onTap: () {
                                        if (f.isImage || f.url.isNotEmpty) {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => FilePreviewScreen(file: f),
                                            ),
                                          );
                                        }
                                      },
                                      onStar: () => _starItem(f),
                                      onShare: () => _shareItem(f),
                                      onRename: () => _renameItem(f),
                                      onDelete: () => _deleteItem(f),
                                    ),
                                  )),
                            ],
                          ),
            ),
          ),
        ],
      ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    if (w > 1200) return 6;
    if (w > 900) return 5;
    if (w > 600) return 4;
    if (w > 400) return 3;
    return 2;
  }
}
