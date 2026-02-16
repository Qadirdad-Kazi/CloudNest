import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/file_item.dart';

/// In-app file preview - images in-app, PDFs via external viewer
class FilePreviewScreen extends StatelessWidget {
  final FileItem file;

  const FilePreviewScreen({super.key, required this.file});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(file.name, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            onPressed: () => _openExternally(),
          ),
        ],
      ),
      body: file.isImage && file.url.isNotEmpty
          ? PhotoView(
              imageProvider: CachedNetworkImageProvider(file.url),
              minScale: PhotoViewComputedScale.contained,
              maxScale: PhotoViewComputedScale.covered * 3,
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    file.isImage ? Icons.broken_image : Icons.picture_as_pdf,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  Text('Preview: ${file.type}'),
                  if (file.url.isNotEmpty)
                    TextButton.icon(
                      onPressed: () => _openExternally(),
                      icon: const Icon(Icons.open_in_browser),
                      label: const Text('Open in browser'),
                    ),
                ],
              ),
            ),
    );
  }

  Future<void> _openExternally() async {
    final uri = Uri.parse(file.url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
