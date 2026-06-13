import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reduce'
})
export class ReducePipe implements PipeTransform {
  transform(items: any[], key: string): number {
    if (!items || items.length === 0) {
      return 0;
    }

    return items.reduce((total, item) => {
      const value = parseFloat(item[key] || 0);
      return total + value;
    }, 0);
  }
}
