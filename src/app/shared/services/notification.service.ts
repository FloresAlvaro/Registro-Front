import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  type: ToastType;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showToast = false;
  toastMessage: ToastMessage = { message: '', type: 'info', icon: '' };

  private getToastIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'pi-check-circle';
      case 'error':
        return 'pi-times-circle';
      case 'info':
        return 'pi-info-circle';
      default:
        return 'pi-info-circle';
    }
  }

  showToastNotification(message: string, type: ToastType = 'info'): void {
    this.toastMessage = {
      message,
      type,
      icon: this.getToastIcon(type),
    };
    this.showToast = true;

    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  hideToast(): void {
    this.showToast = false;
  }
}
