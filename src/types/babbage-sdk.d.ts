declare module 'babbage-sdk' {
  export function getPublicKey(options?: any): Promise<string>;
  export function waitForAuthentication(options?: any): Promise<void>;
  export function isAuthenticated(options?: any): Promise<boolean>;
  export function createAction(options?: any): Promise<any>;

  const _default: any;
  export default _default;
}