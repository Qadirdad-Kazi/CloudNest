import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class FolderCard extends StatelessWidget {
  final String name;
  final bool selected;
  final VoidCallback? onTap;
  final VoidCallback? onStar;
  final VoidCallback? onShare;
  final VoidCallback? onDelete;
  final VoidCallback? onRename;
  final bool starred;
  final bool showActions;

  const FolderCard({
    super.key,
    required this.name,
    this.selected = false,
    this.onTap,
    this.onStar,
    this.onShare,
    this.onDelete,
    this.onRename,
    this.starred = false,
    this.showActions = true,
  });

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
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.folder, size: 64, color: Colors.amber),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (showActions) ...[
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onStar != null)
                      IconButton(icon: Icon(starred ? Icons.star : Icons.star_border, size: 20), onPressed: onStar),
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
