export class DeviceProfile {
  static isCoarsePointer() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  static isTouchPrimary() {
    return DeviceProfile.isCoarsePointer() || navigator.maxTouchPoints > 0;
  }
}
