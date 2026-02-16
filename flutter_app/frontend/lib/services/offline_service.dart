import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/file_item.dart';
import '../models/folder.dart';

/// Offline cache and sync service
/// Caches files/folders locally and queues operations for sync when online
class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;

  Database? _db;
  static const String _dbName = 'cloudnest_offline.db';
  static const int _version = 1;

  OfflineService._internal();

  Future<Database?> get db async {
    if (_db != null) return _db!;
    
    // Skip database initialization on web platform
    if (kIsWeb) {
      print('Offline service: Database not supported on web platform');
      return null;
    }
    
    try {
      final dir = await getApplicationDocumentsDirectory();
      final path = join(dir.path, _dbName);
      _db = await openDatabase(path, version: _version, onCreate: _onCreate);
      return _db!;
    } catch (e) {
      print('Offline service: Failed to initialize database: $e');
      return null;
    }
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE cached_files (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        path TEXT NOT NULL,
        synced INTEGER DEFAULT 1,
        updated_at INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE cached_folders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        path TEXT NOT NULL,
        synced INTEGER DEFAULT 1,
        updated_at INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        payload TEXT,
        created_at INTEGER
      )
    ''');
  }

  Future<void> cacheFiles(String path, List<FileItem> files) async {
    final database = await db;
    if (database == null) return; // Skip on web platform
    
    for (final f in files) {
      await database.insert(
        'cached_files',
        {
          'id': f.id,
          'data': jsonEncode(_fileToMap(f)),
          'path': path,
          'synced': 1,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  Future<void> cacheFolders(String path, List<Folder> folders) async {
    final database = await db;
    if (database == null) return; // Skip on web platform
    
    for (final f in folders) {
      await database.insert(
        'cached_folders',
        {
          'id': f.id,
          'data': jsonEncode(_folderToMap(f)),
          'path': path,
          'synced': 1,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  Future<List<FileItem>> getCachedFiles(String path) async {
    final database = await db;
    if (database == null) return []; // Return empty list on web
    
    final rows = await database.query('cached_files', where: 'path = ?', whereArgs: [path]);
    return rows.map((r) => FileItem.fromJson(jsonDecode(r['data'] as String) as Map<String, dynamic>)).toList();
  }

  Future<List<Folder>> getCachedFolders(String path) async {
    final database = await db;
    if (database == null) return []; // Return empty list on web
    
    final rows = await database.query('cached_folders', where: 'path = ?', whereArgs: [path]);
    return rows.map((r) => Folder.fromJson(jsonDecode(r['data'] as String) as Map<String, dynamic>)).toList();
  }

  Future<void> addToSyncQueue(String action, String entityType, String? entityId, Map<String, dynamic>? payload) async {
    final database = await db;
    if (database == null) return; // Skip on web platform
    
    await database.insert('sync_queue', {
      'action': action,
      'entity_type': entityType,
      'entity_id': entityId,
      'payload': payload != null ? jsonEncode(payload) : null,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final database = await db;
    if (database == null) return []; // Return empty list on web
    
    return await database.query('sync_queue', orderBy: 'created_at ASC');
  }

  Future<void> removeFromSyncQueue(int id) async {
    final database = await db;
    if (database == null) return; // Skip on web platform
    
    await database.delete('sync_queue', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> clearCache() async {
    final database = await db;
    if (database == null) return; // Skip on web platform
    
    await database.delete('cached_files');
    await database.delete('cached_folders');
  }

  Map<String, dynamic> _fileToMap(FileItem f) => {
        '_id': f.id,
        'name': f.name,
        'type': f.type,
        'size': f.size,
        'path': f.path,
        'url': f.url,
        'isStarred': f.starred,
        'inTrash': f.inTrash,
        'createdAt': f.createdAt.toIso8601String(),
        'modifiedAt': f.updatedAt.toIso8601String(),
      };

  Map<String, dynamic> _folderToMap(Folder f) => {
        '_id': f.id,
        'name': f.name,
        'path': f.path,
        'owner': f.owner,
        'isStarred': f.starred,
        'inTrash': f.inTrash,
        'createdAt': f.createdAt.toIso8601String(),
        'modifiedAt': f.modifiedAt.toIso8601String(),
      };
}
