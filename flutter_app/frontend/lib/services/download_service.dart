import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';

/// Download files to device storage
class DownloadService {
  static final DownloadService _instance = DownloadService._internal();
  factory DownloadService() => _instance;
  final Dio _dio = Dio();

  DownloadService._internal();

  Future<File?> download(String url, String fileName, {void Function(int, int)? onProgress}) async {
    try {
      final status = await Permission.storage.request();
      if (!status.isGranted && !status.isLimited) {
        return null;
      }

      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/CloudNest_Downloads');
      if (!await downloadDir.exists()) await downloadDir.create(recursive: true);

      final savePath = path.join(downloadDir.path, fileName);
      await _dio.download(
        url,
        savePath,
        onReceiveProgress: onProgress,
      );
      return File(savePath);
    } catch (_) {
      return null;
    }
  }
}
