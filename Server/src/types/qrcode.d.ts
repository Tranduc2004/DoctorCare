declare module "qrcode" {
  export function toDataURL(data: string, opts?: any): Promise<string>;
  const _default: {
    toDataURL: typeof toDataURL;
  };
  export default _default;
}
