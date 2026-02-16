import '../config/api_config.dart';
import '../models/folder.dart';
import 'api_service.dart';

class FolderService {
  final ApiService _api = ApiService();

  Folder _normalizeFolder(Map<String, dynamic> json) => Folder.fromJson(json);

  Future<Folder> createFolder(String name, {String path = '/'}) async {
    final res = await _api.post(ApiConfig.foldersCreate, data: {
      'name': name,
      'path': path,
    });
    return _normalizeFolder(res.data as Map<String, dynamic>);
  }

  Future<void> deleteFolder(String folderId, {bool permanent = false}) async {
    await _api.delete('${ApiConfig.foldersDelete}/$folderId', queryParameters: {'permanent': permanent});
  }

  Future<Folder> renameFolder(String folderId, String newName) async {
    final res = await _api.patch('${ApiConfig.foldersRename}/$folderId/rename', data: {'newName': newName});
    final data = res.data as Map<String, dynamic>;
    return _normalizeFolder(data['folder'] ?? data);
  }

  Future<Folder> toggleStar(String folderId) async {
    final res = await _api.patch('${ApiConfig.foldersStar}/$folderId/star');
    return _normalizeFolder(res.data as Map<String, dynamic>);
  }
}
