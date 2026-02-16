import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Compress images before upload to save bandwidth
class ImageCompressService {
  static final ImageCompressService _instance = ImageCompressService._internal();
  factory ImageCompressService() => _instance;

  ImageCompressService._internal();

  Future<File?> compress(File file, {int quality = 70, int maxWidth = 1920, int maxHeight = 1920}) async {
    try {
      final ext = path.extension(file.path).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].contains(ext)) return file;

      final dir = await getTemporaryDirectory();
      final targetPath = '${dir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}${path.extension(file.path)}';

      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: quality,
        minWidth: maxWidth,
        minHeight: maxHeight,
      );
      return result != null ? File(result.path) : file;
    } catch (_) {
      return file;
    }
  }
}
