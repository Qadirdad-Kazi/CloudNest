/// Background upload - Workmanager
/// Register upload tasks to continue when app is in background
import 'package:workmanager/workmanager.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    switch (task) {
      case 'uploadTask':
        // Implement background upload logic
        return true;
      default:
        return false;
    }
  });
}

Future<void> initWorkmanager() async {
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: false,
  );
  await Workmanager().registerPeriodicTask(
    'sync-queue',
    'syncTask',
    frequency: const Duration(minutes: 15),
  );
}
