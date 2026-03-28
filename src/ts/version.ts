const major: number = 0;
const minor: number = 2;
const patch: number = 1;
const isAlpha: boolean = true;

export const appVersion: string = `${major}.${minor}.${patch}${isAlpha ? '-Alpha' : ''}`;