declare module 'mammoth' {
  export interface ConvertOptions {
    styleMap?: string[];
    convertImage?: ImageElementConverter;
  }

  export interface ConvertResult {
    value: string;
    messages: Message[];
  }

  export interface Message {
    type: string;
    message: string;
  }

  export interface Image {
    contentType: string;
    read: (encoding: string) => Promise<string>;
  }

  export type ImageElementConverter = (image: Image) => Promise<{ src: string }>;

  export interface ImageConverter {
    imgElement: (convert: ImageElementConverter) => ImageElementConverter;
  }

  export const images: ImageConverter;

  export interface TransformElement {
    type: string;
    styleId?: string;
    styleName?: string;
    alignment?: string;
    indent?: any;
    smallCaps?: boolean;
    [key: string]: any;
  }

  export interface ConvertOptionsWithTransform extends ConvertOptions {
    transformDocument?: (element: TransformElement) => TransformElement;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string },
    options?: ConvertOptions | ConvertOptionsWithTransform
  ): Promise<ConvertResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { path: string }
  ): Promise<ConvertResult>;
}