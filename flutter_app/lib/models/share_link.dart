class ShareLink {
  final String id;
  final String? fileId;
  final String? folderId;
  final String url;
  final bool isPublic;
  final String? password;
  final DateTime? expiresAt;
  final DateTime createdAt;

  ShareLink({
    required this.id,
    this.fileId,
    this.folderId,
    required this.url,
    this.isPublic = true,
    this.password,
    this.expiresAt,
    required this.createdAt,
  });

  factory ShareLink.fromJson(Map<String, dynamic> json) {
    return ShareLink(
      id: json['_id'] ?? json['id'] ?? '',
      fileId: json['fileId'] ?? json['file'],
      folderId: json['folderId'] ?? json['folder'],
      url: json['url'] ?? json['link'] ?? '',
      isPublic: json['isPublic'] ?? true,
      password: json['password'],
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
