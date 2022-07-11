import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const fadeInOut = (timeout = 300) =>
  trigger('fadeInOut', [
    transition(':leave', [
      animate(timeout, keyframes([style({ opacity: 0, offset: 1 })])),
    ]),
    transition('* => *', [
      animate(
        timeout,
        keyframes([
          style({ opacity: 0, offset: 0 }),
          style({ opacity: 1, offset: 1 }),
        ])
      ),
    ]),
  ]);
