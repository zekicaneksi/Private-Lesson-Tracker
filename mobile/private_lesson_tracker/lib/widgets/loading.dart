import 'package:flutter/material.dart';

class Loading extends StatefulWidget {
  final bool isLoading;
  final Widget child;
  const Loading({Key? key, required this.isLoading, required this.child})
      : super(key: key);

  @override
  State<Loading> createState() => _Loading();
}

class _Loading extends State<Loading> with TickerProviderStateMixin {
  late AnimationController controller;
  @override
  void initState() {
    controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..addListener(() {
        setState(() {});
      });
    controller.repeat(reverse: true);
    super.initState();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      primaryFocus?.unfocus();
      return AbsorbPointer(
        absorbing: true,
        child: Stack(
          alignment: Alignment.center,
          children: [
            ColorFiltered(
              colorFilter: const ColorFilter.mode(
                Colors.grey,
                BlendMode.saturation,
              ),
              child: widget.child,
            ),
            CircularProgressIndicator(
              value: controller.value,
            )
          ],
        ),
      );
    } else {
      return widget.child;
    }
  }
}
