class StorageInfo {
  final int storageUsed;
  final int storageLimit;
  final double storagePercentage;
  final bool isNearlyFull;
  final bool isCriticallyFull;
  final int remainingStorage;

  StorageInfo({
    required this.storageUsed,
    required this.storageLimit,
    required this.storagePercentage,
    required this.isNearlyFull,
    required this.isCriticallyFull,
    required this.remainingStorage,
  });

  factory StorageInfo.fromJson(Map<String, dynamic> json) {
    final used = (json['storageUsed'] ?? 0).toInt();
    final limit = (json['storageLimit'] ?? 5 * 1024 * 1024 * 1024).toInt();
    final percentage = limit > 0 ? (used / limit) * 100 : 0.0;

    return StorageInfo(
      storageUsed: used,
      storageLimit: limit,
      storagePercentage: (json['storagePercentage'] ?? percentage).toDouble(),
      isNearlyFull: json['isNearlyFull'] ?? percentage > 80,
      isCriticallyFull: json['isCriticallyFull'] ?? percentage > 95,
      remainingStorage: json['remainingStorage'] ?? (limit - used),
    );
  }

  static StorageInfo get defaultStorage => StorageInfo(
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
        storagePercentage: 0,
        isNearlyFull: false,
        isCriticallyFull: false,
        remainingStorage: 5 * 1024 * 1024 * 1024,
      );
}
