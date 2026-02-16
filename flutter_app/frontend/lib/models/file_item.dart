class FileItem {
  final String id;
  final String name;
  final String type;
  final int size;
  final String path;
  final String? parentPath;
  final String category;
  final String cloudProvider;
  final String? cloudId;
  final String url;
  final bool starred;
  final bool shared;
  final bool inTrash;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastAccessed;
  final String? mongodbId;

  FileItem({
    required this.id,
    required this.name,
    required this.type,
    required this.size,
    required this.path,
    this.parentPath,
    this.category = 'others',
    this.cloudProvider = 'mongodb',
    this.cloudId,
    required this.url,
    this.starred = false,
    this.shared = false,
    this.inTrash = false,
    required this.createdAt,
    required this.updatedAt,
    this.lastAccessed,
    this.mongodbId,
  });

  factory FileItem.fromJson(Map<String, dynamic> json) {
    return FileItem(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'application/octet-stream',
      size: (json['size'] ?? 0).toInt(),
      path: json['path'] ?? '/',
      parentPath: json['parentPath'],
      category: json['category'] ?? 'others',
      cloudProvider: json['cloudProvider'] ?? 'mongodb',
      cloudId: json['cloudId'],
      url: json['url'] ?? '',
      starred: json['isStarred'] ?? json['starred'] ?? false,
      shared: json['isShared'] ?? json['shared'] ?? false,
      inTrash: json['isDeleted'] ?? json['inTrash'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['modifiedAt'] != null
          ? DateTime.tryParse(json['modifiedAt'].toString()) ?? DateTime.now()
          : json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
              : DateTime.now(),
      lastAccessed: json['lastAccessed'] != null
          ? DateTime.tryParse(json['lastAccessed'].toString())
          : null,
      mongodbId: json['mongodbId'],
    );
  }

  bool get isImage => type.startsWith('image/');
  bool get isVideo => type.startsWith('video/');
  bool get isDocument =>
      type.contains('pdf') ||
      type.contains('document') ||
      type.contains('sheet') ||
      type.contains('presentation');
}
