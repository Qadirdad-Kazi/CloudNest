import 'package:flutter/material.dart';
import '../models/share_link.dart';
import '../services/share_service.dart';
import 'main_layout.dart';

class SharedScreen extends StatefulWidget {
  const SharedScreen({super.key});

  @override
  State<SharedScreen> createState() => _SharedScreenState();
}

class _SharedScreenState extends State<SharedScreen> {
  final ShareService _shareService = ShareService();
  List<ShareLink> _links = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final links = await _shareService.getShares();
      setState(() {
        _links = links;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'Shared',
      activeItem: 'shared',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error))
              : _links.isEmpty
                  ? const Center(child: Text('No shared links'))
                  : ListView.builder(
                      itemCount: _links.length,
                      itemBuilder: (_, i) {
                        final link = _links[i];
                        return ListTile(
                          leading: const Icon(Icons.link),
                          title: Text(link.url),
                          subtitle: Text(link.isPublic ? 'Public' : 'Private'),
                          trailing: IconButton(
                            icon: const Icon(Icons.copy),
                            onPressed: () {
                              // Copy to clipboard
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
                            },
                          ),
                        );
                      },
                    ),
    );
  }
}
