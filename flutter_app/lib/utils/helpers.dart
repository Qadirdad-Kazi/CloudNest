import 'package:intl/intl.dart';

String formatBytes(int bytes) {
  if (bytes == 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var i = (bytes / 1024).floor();
  if (i == 0) return '$bytes B';
  var u = 1;
  while (i >= 1024 && u < units.length - 1) {
    i = (i / 1024).floor();
    u++;
  }
  return '${i.toStringAsFixed(2)} ${units[u]}';
}

String formatDate(DateTime date) {
  return DateFormat('MMM d, y').format(date);
}

String formatDateTime(DateTime date) {
  return DateFormat('MMM d, y HH:mm').format(date);
}
