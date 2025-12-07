export const isMobileOrTablet = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for iOS
  // Note: iPad on iOS 13+ detection needs maxTouchPoints check if it requests desktop site, 
  // but user specifically asked to avoid screen size. 
  // However, maxTouchPoints is a hardware capability, not screen size.
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return true;
  }

  // Check for Android
  if (/android/i.test(userAgent)) {
    return true;
  }

  // Check for other mobile identifiers
  if (/Mobile|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return true;
  }

  // Fallback for iPads masquerading as desktop (Macintosh) but having touch points
  // This is technically checking hardware capability, not screen size.
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
};
