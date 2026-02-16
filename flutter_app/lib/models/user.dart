class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final UserSettings? settings;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'user',
    this.settings,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      settings: json['settings'] != null
          ? UserSettings.fromJson(json['settings'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'settings': settings?.toJson(),
    };
  }

  bool get isAdmin => role == 'admin';
}

class UserSettings {
  final bool? darkMode;
  final bool? compactView;
  final bool? showThumbnails;
  final String? language;
  final NotificationSettings? notifications;
  final PrivacySettings? privacy;

  UserSettings({
    this.darkMode,
    this.compactView,
    this.showThumbnails,
    this.language,
    this.notifications,
    this.privacy,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      darkMode: json['appearance']?['darkMode'] ?? json['darkMode'],
      compactView: json['appearance']?['compactView'] ?? json['compactView'],
      showThumbnails: json['appearance']?['showThumbnails'] ?? json['showThumbnails'],
      language: json['language'],
      notifications: json['notifications'] != null
          ? NotificationSettings.fromJson(json['notifications'] as Map<String, dynamic>)
          : null,
      privacy: json['privacy'] != null
          ? PrivacySettings.fromJson(json['privacy'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appearance': {
        'darkMode': darkMode,
        'compactView': compactView,
        'showThumbnails': showThumbnails,
      },
      'language': language,
      'notifications': notifications?.toJson(),
      'privacy': privacy?.toJson(),
    };
  }
}

class NotificationSettings {
  final bool? email;
  final bool? push;
  final bool? updates;

  NotificationSettings({this.email, this.push, this.updates});

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      email: json['email'],
      push: json['push'],
      updates: json['updates'],
    );
  }

  Map<String, dynamic> toJson() =>
      {'email': email, 'push': push, 'updates': updates};
}

class PrivacySettings {
  final bool? publicProfile;
  final bool? showActivity;
  final bool? shareStats;

  PrivacySettings({this.publicProfile, this.showActivity, this.shareStats});

  factory PrivacySettings.fromJson(Map<String, dynamic> json) {
    return PrivacySettings(
      publicProfile: json['publicProfile'],
      showActivity: json['showActivity'],
      shareStats: json['shareStats'],
    );
  }

  Map<String, dynamic> toJson() =>
      {
        'publicProfile': publicProfile,
        'showActivity': showActivity,
        'shareStats': shareStats,
      };
}
