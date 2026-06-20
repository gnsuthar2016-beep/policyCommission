import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loadingCount = 0;
  private _loading$ = new BehaviorSubject<boolean>(false);

  get loading$() {
    return this._loading$.asObservable();
  }

  show() {
    this._loadingCount++;
    if (this._loadingCount > 0) {
      this._loading$.next(true);
    }
  }

  hide() {
    this._loadingCount = Math.max(0, this._loadingCount - 1);
    if (this._loadingCount === 0) {
      this._loading$.next(false);
    }
  }

  reset() {
    this._loadingCount = 0;
    this._loading$.next(false);
  }
}
