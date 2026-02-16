class Folder {
  final String id;
  final String name;
  final String path;
  final String owner;
  final bool shared;
  final bool starred;
  final bool inTrash;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime modifiedAt;

  Folder({
    required this.id,
    required this.name,
    required this.path,
    required this.owner,
    this.shared = false,
    this.starred = false,
    this.inTrash = false,
    this.tags = const [],
    required this.createdAt,
    required this.modifiedAt,
  });

  factory Folder.fromJson(Map<String, dynamic> json) {
    return Folder(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      path: json['path'] ?? '/',
      owner: json['owner'] ?? json['userId'] ?? '',
      shared: json['shared'] ?? false,
      starred: json['isStarred'] ?? json['starred'] ?? false,
      inTrash: json['isDeleted'] ?? json['inTrash'] ?? false,
      tags: json['tags'] != null
          ? List<String>.from(json['tags'])
          : [],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      modifiedAt: json['modifiedAt'] != null
          ? DateTime.tryParse(json['modifiedAt'].toString()) ?? DateTime.now()
          : json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
              : DateTime.now(),
    );
  }
}
