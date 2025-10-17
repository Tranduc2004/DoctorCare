declare module "qrcode" {
  export function toDataURL(
    text: string,
    opts?: { margin?: number }
  ): Promise<string>;
}
