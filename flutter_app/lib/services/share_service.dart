import '../config/api_config.dart';
import '../models/share_link.dart';
import 'api_service.dart';

class ShareService {
  final ApiService _api = ApiService();

  /// Create share link. itemType is 'file' or 'folder'
  Future<ShareLink> createShare(
    String itemId, {
    required String itemType,
    bool isPublic = true,
    String? password,
    DateTime? expiresAt,
  }) async {
    final data = <String, dynamic>{
      'itemId': itemId,
      'itemType': itemType,
      'isPublic': isPublic,
      if (password != null && password.isNotEmpty) 'password': password,
      if (expiresAt != null) 'expiresAt': expiresAt.toIso8601String(),
    };
    final res = await _api.post(ApiConfig.shares, data: data);
    return ShareLink.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<ShareLink>> getShares() async {
    final res = await _api.get(ApiConfig.shares);
    final list = res.data as List<dynamic>? ?? [];
    return list.map((e) => ShareLink.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> deleteShare(String shareId) async {
    await _api.delete('${ApiConfig.shares}/$shareId');
  }
}
