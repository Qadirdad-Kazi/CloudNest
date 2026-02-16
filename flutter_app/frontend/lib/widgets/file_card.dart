import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/file_item.dart';
import '../theme/app_theme.dart';
import '../utils/helpers.dart';

class FileCard extends StatelessWidget {
  final FileItem file;
  final bool selected;
  final VoidCallback? onTap;
  final VoidCallback? onStar;
  final VoidCallback? onShare;
  final VoidCallback? onDelete;
  final VoidCallback? onRename;
  final bool showActions;

  const FileCard({
    super.key,
    required this.file,
    this.selected = false,
    this.onTap,
    this.onStar,
    this.onShare,
    this.onDelete,
    this.onRename,
    this.showActions = true,
  });

  IconData get _fileIcon {
    if (file.isImage) return Icons.image;
    if (file.isVideo) return Icons.video_file;
    if (file.type.contains('pdf')) return Icons.picture_as_pdf;
    return Icons.insert_drive_file;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(4),
      color: selected ? AppTheme.primaryColor.withValues(alpha: 0.1) : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: file.isImage && file.url.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: file.url,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                          errorWidget: (_, __, ___) => Icon(_fileIcon, size: 48, color: Colors.grey),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(_fileIcon, size: 48, color: Colors.grey),
                      ),
              ),
              const SizedBox(height: 8),
              Text(
                file.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 4),
              Text(formatBytes(file.size), style: Theme.of(context).textTheme.bodySmall),
              if (showActions) ...[
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onStar != null)
                      IconButton(icon: Icon(file.starred ? Icons.star : Icons.star_border, size: 20), onPressed: onStar),
                    if (onShare != null) IconButton(icon: const Icon(Icons.share, size: 20), onPressed: onShare),
                    if (onRename != null) IconButton(icon: const Icon(Icons.edit, size: 20), onPressed: onRename),
                    if (onDelete != null) IconButton(icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red), onPressed: onDelete),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
