/// Home screen widget - quick access to recent/starred
/// Requires platform setup (Android: home_widget, iOS: App Intents)
import 'package:home_widget/home_widget.dart';

class HomeWidgetHelper {
  static Future<void> updateWidget({int? recentCount, int? starredCount}) async {
    try {
      await HomeWidget.saveWidgetData<int>('recentCount', recentCount ?? 0);
      await HomeWidget.saveWidgetData<int>('starredCount', starredCount ?? 0);
      await HomeWidget.updateWidget(
        name: 'CloudNestWidget',
        androidName: 'CloudNestWidget',
        iOSName: 'CloudNestWidget',
      );
    } catch (_) {}
  }
}
