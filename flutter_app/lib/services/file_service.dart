import 'dart:io';
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/file_item.dart';
import '../models/folder.dart';
import 'api_service.dart';

class FileService {
  final ApiService _api = ApiService();

  FileItem _normalizeFile(Map<String, dynamic> json) {
    return FileItem.fromJson(json);
  }

  Folder _normalizeFolder(Map<String, dynamic> json) {
    return Folder.fromJson(json);
  }

  Future<List<FileItem>> getFiles({String path = '/'}) async {
    final res = await _api.get(ApiConfig.files, queryParameters: {'path': path});
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) => _normalizeFile(e as Map<String, dynamic>)).toList();
  }

  Future<List<Folder>> getFolders({String path = '/'}) async {
    final res = await _api.get(ApiConfig.folders, queryParameters: {'path': path});
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) => _normalizeFolder(e as Map<String, dynamic>)).toList();
  }

  Future<FileItem> uploadFile(
    File file, {
    String parentPath = '/',
    void Function(int, int)? onProgress,
  }) async {
    final formData = {
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split(Platform.pathSeparator).last,
      ),
      'path': parentPath,
    };

    final res = await _api.uploadMultipart(
      ApiConfig.filesUpload,
      formData,
      onProgress: onProgress != null
          ? (sent, total) => onProgress(sent, total)
          : null,
    );

    return _normalizeFile(res.data as Map<String, dynamic>);
  }

  Future<List<FileItem>> getStarred() async {
    final res = await _api.get(ApiConfig.filesStarred);
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) => _normalizeFile(e as Map<String, dynamic>)).toList();
  }

  Future<List<FileItem>> getRecent({int days = 7}) async {
    final res = await _api.get(ApiConfig.filesRecent, queryParameters: {'days': days});
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) => _normalizeFile(e as Map<String, dynamic>)).toList();
  }

  Future<List<dynamic>> getTrash() async {
    final filesRes = await _api.get(ApiConfig.filesTrash);
    final foldersRes = await _api.get('${ApiConfig.folders}/trash');
    final files = (filesRes.data as List<dynamic>? ?? []).map((e) => _normalizeFile(e as Map<String, dynamic>)).toList();
    final folders = (foldersRes.data as List<dynamic>? ?? []).map((e) => _normalizeFolder(e as Map<String, dynamic>)).toList();
    return [...folders, ...files];
  }

  Future<void> moveToTrash(String id, {bool isFolder = false}) async {
    if (isFolder) {
      // Folder: DELETE without permanent=true soft-deletes (moves to trash)
      await _api.delete('${ApiConfig.foldersDelete}/$id');
    } else {
      await _api.post('${ApiConfig.filesTrash}/$id');
    }
  }

  Future<void> restore(String id, {bool isFolder = false}) async {
    // Server only has file restore - folder restore not implemented
    if (!isFolder) {
      await _api.post('${ApiConfig.filesRestore}/$id');
    }
  }

  Future<void> deletePermanently(String id, {bool isFolder = false}) async {
    if (isFolder) {
      await _api.delete('${ApiConfig.foldersDelete}/$id', queryParameters: {'permanent': 'true'});
    } else {
      await _api.delete('${ApiConfig.files}/$id', queryParameters: {'permanent': 'true'});
    }
  }

  Future<void> emptyTrash() async {
    await _api.delete(ApiConfig.filesEmptyTrash);
  }

  Future<FileItem> toggleStar(String fileId) async {
    final res = await _api.patch('${ApiConfig.filesStar}/$fileId');
    return _normalizeFile(res.data as Map<String, dynamic>);
  }

  Future<Folder> toggleFolderStar(String folderId) async {
    final res = await _api.patch('${ApiConfig.foldersStar}/$folderId/star');
    return _normalizeFolder(res.data as Map<String, dynamic>);
  }

  Future<FileItem> renameFile(String fileId, String newName) async {
    final res = await _api.patch('${ApiConfig.filesUpdate}/$fileId', data: {'name': newName});
    return _normalizeFile(res.data as Map<String, dynamic>);
  }

  Future<Folder> renameFolder(String folderId, String newName) async {
    final res = await _api.patch('${ApiConfig.foldersRename}/$folderId/rename', data: {'newName': newName});
    final data = res.data as Map<String, dynamic>;
    return _normalizeFolder(data['folder'] ?? data);
  }

  Future<List<dynamic>> search(String query) async {
    final res = await _api.get('${ApiConfig.files}/search', queryParameters: {'query': query});
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) {
      final m = e as Map<String, dynamic>;
      if (m['type'] != null) return _normalizeFile(m);
      return _normalizeFolder(m);
    }).toList();
  }

  String getDownloadUrl(String fileId) => '${ApiConfig.apiUrl}${ApiConfig.files}/download/$fileId';
}
