import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
export class ShortCodeUtility {
  public static generateShortCode(length = 6): string {
    const nanoid = customAlphabet(CHARS, length);

    return nanoid();
  }
}
